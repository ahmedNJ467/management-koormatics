# DataTable Migration Guide

This guide shows how to migrate existing tables to use the new `DataTable` component.

## Prerequisites

First, install the required dependency:

```bash
npm install @tanstack/react-table
```

## Migration Steps

### Step 1: Define Column Definitions

Convert your table structure to column definitions:

```tsx
import { ColumnDef } from "@tanstack/react-table";

// Example: Spare Parts Table
const columns: ColumnDef<SparePart>[] = [
  {
    accessorKey: "name",
    header: "Part Name",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "part_number",
    header: "Part Number",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "manufacturer",
    header: "Manufacturer",
  },
  {
    accessorKey: "quantity",
    header: "Stock",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      return (
        <div className="text-right">
          {quantity}
        </div>
      );
    },
  },
  {
    accessorKey: "unit_price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("unit_price") as number;
      return (
        <div className="text-right font-medium">
          {formatCurrency(price)}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const part = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(part)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(part)}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];
```

### Step 2: Replace Table Implementation

**Before:**
```tsx
<div className="border rounded overflow-x-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Category</TableHead>
        {/* ... */}
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredParts.map((part) => (
        <TableRow key={part.id}>
          <TableCell>{part.name}</TableCell>
          <TableCell>{part.category}</TableCell>
          {/* ... */}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

**After:**
```tsx
import { DataTable } from "@/components/ui/data-table";

<DataTable
  columns={columns}
  data={spareParts}
  searchKey="name"
  searchPlaceholder="Search parts..."
  enableColumnVisibility
  enableExport
  onExport={handleExportCSV}
  isLoading={isLoading}
  emptyMessage="No spare parts found."
  pageSize={25}
/>
```

### Step 3: Remove Manual Filtering/Sorting/Pagination

The DataTable handles all of this automatically. Remove:

- Manual search state and filtering logic
- Manual sorting state and handlers
- Manual pagination state and calculations

**Before:**
```tsx
const [searchQuery, setSearchQuery] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const [sortConfig, setSortConfig] = useState({...});

const filteredParts = useMemo(() => {
  // Complex filtering logic
}, [parts, searchQuery, filters]);

const paginatedParts = filteredParts.slice(startIndex, endIndex);
```

**After:**
```tsx
// Just pass the data directly - DataTable handles everything!
<DataTable columns={columns} data={spareParts} />
```

### Step 4: Handle Actions

For row actions (edit, delete, etc.), include them in the column definitions:

```tsx
{
  id: "actions",
  header: "Actions",
  cell: ({ row }) => {
    const item = row.original;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEdit(item)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDelete(item)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
}
```

## Complete Example

Here's a complete example for a simple table:

```tsx
"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Item {
  id: string;
  name: string;
  category: string;
  status: string;
}

export function ItemsTable() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(row.original)}
        >
          Edit
        </Button>
      ),
    },
  ];

  const handleExport = () => {
    // Export logic
  };

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={items}
        searchKey="name"
        searchPlaceholder="Search items..."
        enableColumnVisibility
        enableExport
        onExport={handleExport}
        isLoading={isLoading}
        pageSize={10}
      />
    </div>
  );
}
```

## Benefits

1. **Less Code**: No need to manage filtering, sorting, pagination manually
2. **Better UX**: Built-in search, column visibility, and export
3. **Consistent**: All tables have the same look and feel
4. **Accessible**: Built with accessibility in mind
5. **Performant**: Optimized rendering and virtual scrolling support

## Advanced Features

### Custom Filters

You can add custom filters using column filters:

```tsx
{
  accessorKey: "status",
  header: "Status",
  filterFn: (row, id, value) => {
    return row.getValue(id) === value;
  },
}
```

### Custom Sorting

```tsx
{
  accessorKey: "date",
  header: "Date",
  sortingFn: (rowA, rowB) => {
    const dateA = new Date(rowA.getValue("date"));
    const dateB = new Date(rowB.getValue("date"));
    return dateA.getTime() - dateB.getTime();
  },
}
```

### Row Selection

The DataTable supports row selection out of the box. Just add a selection column:

```tsx
import { Checkbox } from "@/components/ui/checkbox";

const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) =>
          table.toggleAllPageRowsSelected(!!value)
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  // ... other columns
];
```

## Migration Checklist

- [ ] Install `@tanstack/react-table`
- [ ] Define column definitions
- [ ] Replace table markup with DataTable component
- [ ] Remove manual filtering logic
- [ ] Remove manual sorting logic
- [ ] Remove manual pagination logic
- [ ] Test search functionality
- [ ] Test column visibility
- [ ] Test export functionality
- [ ] Verify accessibility
- [ ] Test on mobile devices

