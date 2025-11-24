# Quick Start Guide

This guide helps you quickly get started with the new features and optimizations.

## 🚀 Installation

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `@tanstack/react-table` - For advanced data tables
- `@next/bundle-analyzer` - For performance monitoring (dev dependency)

### Step 2: Add Database Indexes

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Open `SUPABASE_INDEXES_SAFE.sql`
4. Copy the entire file
5. Paste into SQL Editor
6. Click "Run"
7. Wait for completion (1-2 minutes)

**Verification**:
```sql
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
```

Should return 80+ indexes.

---

## ✅ Verify Installation

### Check Dependencies

```bash
npm list @tanstack/react-table
npm list @next/bundle-analyzer
```

Both should show installed versions.

### Check TypeScript

```bash
npm run typecheck
```

Should pass without errors related to `@tanstack/react-table`.

### Test the Application

```bash
npm run dev
```

Visit `http://localhost:8080` and:
1. Navigate to Spare Parts page
2. Verify the new table works
3. Test sorting, filtering, and pagination
4. Test column visibility toggle
5. Test export functionality

---

## 📊 Performance Analysis

### Run Bundle Analyzer

```bash
npm run analyze
```

This will:
- Build the application
- Open bundle visualization
- Show dependency sizes

**What to look for**:
- Large dependencies (>200KB)
- Duplicate packages
- Opportunities for code splitting

### Run Performance Audit

```bash
npm run perf:audit
```

This displays a checklist of:
- Bundle optimization tasks
- Database optimization tasks
- Image optimization tasks
- React optimization tasks

---

## 🔄 Using the New DataTable

### Example: Spare Parts Table

The Spare Parts page has been migrated to use the new DataTable component.

**Features**:
- ✅ Built-in search
- ✅ Column sorting
- ✅ Column visibility toggle
- ✅ Pagination
- ✅ Export functionality
- ✅ Loading states
- ✅ Empty states

**How it works**:
1. Search is built-in (no separate search input needed)
2. Click column headers to sort
3. Use column visibility button to show/hide columns
4. Pagination is automatic
5. Export button in table toolbar

---

## 📝 Next Steps

### 1. Test Everything

- [ ] Spare Parts table works correctly
- [ ] All features function as expected
- [ ] No console errors
- [ ] Mobile experience is good

### 2. Run Performance Tests

- [ ] Bundle analyzer shows reasonable sizes
- [ ] Lighthouse score is 90+
- [ ] Core Web Vitals are good
- [ ] No performance regressions

### 3. Migrate Other Tables

Follow the same pattern for:
- Vehicles table
- Invoices table
- Contracts table
- Other data tables

See `MIGRATION_EXAMPLE_SPARE_PARTS.md` for guidance.

### 4. Monitor Performance

- Set up regular performance audits
- Monitor bundle sizes
- Track Core Web Vitals
- Review slow queries

---

## 🐛 Troubleshooting

### TypeScript Errors

**Error**: Cannot find module '@tanstack/react-table'

**Solution**:
```bash
npm install @tanstack/react-table
npm run typecheck
```

### Build Errors

**Error**: Module not found

**Solution**:
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Database Index Errors

**Error**: Column does not exist

**Solution**:
- Use `SUPABASE_INDEXES_SAFE.sql` (checks for column existence)
- Or manually remove problematic index lines

### Table Not Rendering

**Check**:
1. Is `@tanstack/react-table` installed?
2. Are there console errors?
3. Is data loading correctly?
4. Check browser console for errors

---

## 📚 Documentation

- `IMPLEMENTATION_CHECKLIST.md` - Complete step-by-step guide
- `MIGRATION_EXAMPLE_SPARE_PARTS.md` - Table migration example
- `PERFORMANCE_MONITORING.md` - Performance monitoring guide
- `SETUP_INSTRUCTIONS.md` - Setup and troubleshooting
- `TABLE_MIGRATION_GUIDE.md` - General migration guide

---

## 🎯 Success Criteria

You're ready when:

- ✅ Dependencies installed
- ✅ Database indexes added
- ✅ Spare Parts table migrated and working
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ Performance metrics meet targets
- ✅ All features tested

---

## 💡 Tips

1. **Start Small**: Test one table migration before doing all
2. **Monitor Performance**: Run audits regularly
3. **Keep Documentation Updated**: Document any customizations
4. **Test Thoroughly**: Test all features after migration
5. **Backup First**: Always backup before major changes

---

**Need Help?** Check the documentation files or review the implementation checklist.

