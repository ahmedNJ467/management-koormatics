-- Fix RLS initplan warnings by wrapping auth.* calls in SELECT
-- For policies that reference auth.uid() or auth.role() directly in USING/WITH CHECK,
-- we update them to use (select auth.uid()) / (select auth.role()) as recommended.

DO $$
DECLARE
  r RECORD;
  new_using TEXT;
  new_check TEXT;
BEGIN
  FOR r IN
    SELECT
      schemaname,
      tablename,
      policyname,
      cmd,
      roles,
      permissive,
      COALESCE(qual, '') AS using_expr,
      COALESCE(with_check, '') AS check_expr
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%'
        OR qual LIKE '%auth.role()%' OR with_check LIKE '%auth.role()%'
      )
  LOOP
    new_using := r.using_expr;
    new_check := r.check_expr;

    IF new_using IS NOT NULL AND new_using <> '' THEN
      new_using := replace(new_using, 'auth.uid()', '(select auth.uid())');
      new_using := replace(new_using, 'auth.role()', '(select auth.role())');
    END IF;

    IF new_check IS NOT NULL AND new_check <> '' THEN
      new_check := replace(new_check, 'auth.uid()', '(select auth.uid())');
      new_check := replace(new_check, 'auth.role()', '(select auth.role())');
    END IF;

    -- Apply changes only if something actually changed
    IF new_using IS DISTINCT FROM r.using_expr OR new_check IS DISTINCT FROM r.check_expr THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I %s %s',
        r.policyname,
        r.schemaname,
        r.tablename,
        CASE
          WHEN new_using IS NOT NULL AND new_using <> '' THEN format('USING (%s)', new_using) ELSE '' END,
        CASE
          WHEN new_check IS NOT NULL AND new_check <> '' THEN format(' WITH CHECK (%s)', new_check) ELSE '' END
      );
    END IF;
  END LOOP;
END $$;


