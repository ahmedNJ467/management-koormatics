# Spare Parts Table Migration Example

This document shows how to migrate the Spare Parts table from the old implementation to the new `DataTable` component.

## Before (Old Implementation)

The old `PartsTable` component required:
- Manual sorting state management
- Manual pagination logic
- Manual filtering/search
- Custom loading and empty states
- Manual column header click handlers

**File**: `src/components/spare-parts/parts-table/parts-table.tsx`

## After (New Implementation)

The new `PartsTableMigrated` component:
- ✅ Uses `@tanstack/react-table` for all table functionality
- ✅ Built-in sorting, filtering, and pagination
- ✅ Built-in loading and empty states
- ✅ Column visibility toggle
- ✅ Export functionality support
- ✅ Better accessibility
- ✅ Responsive design

**File**: `src/components/spare-parts/parts-table/parts-table-migrated.tsx`

## Migration Steps

### Step 1: Install Dependencies

```bash
npm install @tanstack/react-table
```

### Step 2: Update the Component

Replace the old `PartsTable` import with the new migrated version:

**Before:**
```tsx
import { PartsTable } from "@/components/spare-parts/parts-table/parts-table";
```

**After:**
```tsx
import { PartsTableMigrated } from "@/components/spare-parts/parts-table/parts-table-migrated";
```

### Step 3: Simplify the Page Component

The page component (`src/pages/SpareParts.tsx`) can be significantly simplified:

**Remove:**
- Manual sorting state (`usePartsSorting`)
- Manual pagination state and logic
- Manual filtering logic (DataTable handles search)
- Manual search input (DataTable has built-in search)

**Keep:**
- Category and manufacturer filters (can be added as column filters later)
- Export functionality
- Dialog management

### Step 4: Update Usage

**Before:**
```tsx
<PartsTable
  parts={paginatedParts}
  onPartClick={handlePartClick}
  isLoading={false}
  onSort={handleSort}
  sortConfig={sortConfig}
/>

{/* Manual pagination controls */}
<div className="flex items-center justify-between">
  <span>Showing {startIndex + 1}-{endIndex} of {total}</span>
  {/* Pagination buttons */}
</div>
```

**After:**
```tsx
<PartsTableMigrated
  parts={spareParts} // Pass all data, not paginated
  onPartClick={handlePartClick}
  isLoading={isLoading}
  onExport={handleExportCSV}
/>
```

### Step 5: Remove Unused Code

After migration, you can remove:
- `usePartsSorting` hook (if only used for this table)
- Manual pagination state and calculations
- Manual search input component
- Manual sorting handlers

## Benefits

### 1. Less Code
- Removed ~150 lines of manual table logic
- Simpler component structure
- Easier to maintain

### 2. Better Features
- Built-in column visibility toggle
- Better search functionality
- Consistent pagination UI
- Better accessibility

### 3. Performance
- Optimized rendering with `@tanstack/react-table`
- Virtual scrolling support (can be added)
- Better memoization

### 4. Consistency
- Same table component across all pages
- Consistent UX
- Easier to update globally

## Column Definitions

The new implementation uses column definitions:

```tsx
const columns: ColumnDef<SparePart>[] = [
  {
    accessorKey: "name",
    header: "Part Name",
    cell: ({ row }) => (
      <div onClick={() => onPartClick(row.original)}>
        {row.getValue("name")}
      </div>
    ),
  },
  // ... more columns
];
```

This makes it easy to:
- Add/remove columns
- Customize cell rendering
- Add column-specific filters
- Add sorting per column

## Advanced Features

### Column Visibility

Users can toggle column visibility:
- Click the column visibility button
- Select/deselect columns
- Preferences can be saved (future enhancement)

### Export

The DataTable supports export:
```tsx
<PartsTableMigrated
  onExport={handleExportCSV}
  enableExport
/>
```

### Custom Search

The DataTable has built-in search:
```tsx
<PartsTableMigrated
  searchKey="name" // Search in name field
  searchPlaceholder="Search parts..."
/>
```

You can also search across multiple fields by customizing the `globalFilterFn`.

## Testing

After migration, test:
1. ✅ Sorting works on all columns
2. ✅ Search filters correctly
3. ✅ Pagination works
4. ✅ Column visibility toggle works
5. ✅ Export functionality works
6. ✅ Clicking rows opens details dialog
7. ✅ Loading states display correctly
8. ✅ Empty states display correctly
9. ✅ Mobile responsiveness

## Next Steps

1. **Test the migrated component** in development
2. **Update the page component** to use the new table
3. **Remove old table component** after verification
4. **Apply same pattern** to other tables:
   - Vehicles table
   - Invoices table
   - Contracts table
   - Maintenance table

## Notes

- The migrated component maintains all existing functionality
- The API is similar, making migration straightforward
- All existing features are preserved
- New features are added automatically

