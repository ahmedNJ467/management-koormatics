# Setup Instructions

## Required Dependencies

Before using the new DataTable component, install the required dependency:

```bash
npm install @tanstack/react-table
```

## Optional Dependencies

For bundle analysis and performance monitoring:

```bash
npm install --save-dev @next/bundle-analyzer
```

## Verification

After installing dependencies, verify the setup:

1. **Check TypeScript errors are resolved**:
   - The migrated table component should have no type errors
   - Run `npm run typecheck` to verify

2. **Test the component**:
   - Import and use `PartsTableMigrated` in development
   - Verify all features work correctly

3. **Run bundle analysis** (optional):
   ```bash
   npm run analyze
   ```

## Next Steps

1. Install `@tanstack/react-table`
2. Test the migrated spare parts table
3. Migrate other tables following the same pattern
4. Run performance audits

## Troubleshooting

### Type Errors

If you see type errors about `@tanstack/react-table`:
- Make sure you've run `npm install @tanstack/react-table`
- Restart your TypeScript server in your IDE
- Run `npm run typecheck` to verify

### Import Errors

If imports fail:
- Clear `.next` folder: `rm -rf .next` (or `rimraf .next` on Windows)
- Reinstall dependencies: `npm install`
- Restart dev server

