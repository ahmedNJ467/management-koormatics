# Roles Update - Migration Instructions

## Overview
This migration updates the role system to only include 4 roles and assigns super admin to support@koormatics.com.

## Changes Made

### 1. Role Cleanup
- **Keeps only these 4 roles:**
  - `super_admin` - Super Administrator
  - `fleet_manager` - Fleet Manager
  - `operations_manager` - Operations Manager
  - `finance_manager` - Finance Manager

- **Deletes all other roles** (e.g., `admin`, `manager`, `operator`, `viewer`, etc.)

### 2. Super Admin Assignment
- Assigns `super_admin` role to `support@koormatics.com`
- Updates user metadata to include the role
- Removes any existing roles from this user first

### 3. Data Cleanup
- Removes invalid role assignments from `user_roles` table
- Cleans up orphaned references

## How to Run

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/20250126_update_roles_and_super_admin.sql`
4. Copy and paste the entire SQL script
5. Click **Run** or press `Ctrl+Enter`
6. Check the output for success messages

### Option 2: Via Supabase CLI
```bash
supabase migration up
```

## Verification

After running the migration, verify:

1. **Check roles count:**
   ```sql
   SELECT slug, name FROM public.roles;
   ```
   Should show exactly 4 roles.

2. **Check super admin assignment:**
   ```sql
   SELECT u.email, ur.role_slug 
   FROM auth.users u
   JOIN public.user_roles ur ON u.id = ur.user_id
   WHERE u.email = 'support@koormatics.com';
   ```
   Should show `super_admin` role.

3. **Check for invalid roles:**
   ```sql
   SELECT COUNT(*) FROM public.roles 
   WHERE slug NOT IN ('super_admin', 'fleet_manager', 'operations_manager', 'finance_manager');
   ```
   Should return 0.

## Important Notes

- ⚠️ **This migration will DELETE all roles except the 4 specified ones**
- ⚠️ **Users with deleted roles will lose those role assignments**
- ✅ **The migration is safe to run multiple times** (idempotent)
- ✅ **If support@koormatics.com doesn't exist, the migration will log a notice but won't fail**

## Code Updates

The following files have been updated to reflect the new role structure:

1. `src/constants/roles.ts` - Updated role constants
2. `supabase/migrations/20250126_update_roles_and_super_admin.sql` - Migration script

## Rollback

If you need to rollback, you would need to:
1. Manually restore any deleted roles
2. Reassign roles to affected users
3. Remove super_admin from support@koormatics.com

However, the migration is designed to be safe and only affects role definitions, not user data.

