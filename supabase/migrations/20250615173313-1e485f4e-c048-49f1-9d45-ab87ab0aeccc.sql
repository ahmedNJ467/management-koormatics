
ALTER TABLE public.invoices
ADD COLUMN vat_percentage NUMERIC,
ADD COLUMN discount_amount NUMERIC;
