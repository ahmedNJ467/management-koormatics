# Select Component Error Fix

## Error Description

```
A <Select.Item /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder.
```

## Root Cause

The error was caused by Select components in the LeaseForm having empty string values (`""`) or placeholder values that conflicted with the Select component's internal state management. Specifically:

1. **contract_id field**: Was using empty string `""` as default value
2. **assigned_driver_id field**: Was using `"none"` as a placeholder value
3. **SelectItem components**: Had values that could conflict with the Select's internal placeholder handling

## Solution Applied

### 1. Updated Default Values

**File**: `src/components/leasing/LeaseForm.tsx`

**Before**:

```typescript
defaultValues: {
  contract_id: "",
  assigned_driver_id: "none",
  // ...
}
```

**After**:

```typescript
defaultValues: {
  contract_id: "no-contract",
  assigned_driver_id: "no-driver",
  // ...
}
```

### 2. Updated SelectItem Values

**Before**:

```tsx
<SelectItem value="none">No contract selected</SelectItem>
<SelectItem value="none">No driver assigned</SelectItem>
```

**After**:

```tsx
<SelectItem value="no-contract">No contract selected</SelectItem>
<SelectItem value="no-driver">No driver assigned</SelectItem>
```

### 3. Updated Form Reset Logic

**Before**:

```typescript
contract_id: lease.contract_id || "",
assigned_driver_id: lease.assigned_driver_id || "none",
```

**After**:

```typescript
contract_id: lease.contract_id || "no-contract",
assigned_driver_id: lease.assigned_driver_id || "no-driver",
```

### 4. Updated Submit Logic

**Before**:

```typescript
contract_id: data.contract_id || null,
assigned_driver_id: data.assigned_driver_id === "none" ? null : data.assigned_driver_id,
```

**After**:

```typescript
contract_id: data.contract_id === "no-contract" ? null : data.contract_id,
assigned_driver_id: data.assigned_driver_id === "no-driver" ? null : data.assigned_driver_id,
```

## Why This Fixes the Error

### 1. **Non-Empty String Values**

- Select components now use meaningful placeholder values (`"no-contract"`, `"no-driver"`) instead of empty strings
- This prevents conflicts with the Select component's internal placeholder handling

### 2. **Consistent Value Handling**

- All Select components now have consistent value patterns
- Placeholder values are clearly distinguished from actual data values

### 3. **Proper Data Conversion**

- Form submission properly converts placeholder values back to `null` for database storage
- Maintains data integrity while providing good UX

## Technical Details

### Select Component Requirements

- Select.Item components cannot have empty string (`""`) values
- Values must be non-empty strings or the component will throw an error
- Placeholder values should be distinct from actual data values

### Form State Management

- Default values must match the SelectItem values exactly
- Form reset logic must use the same placeholder values
- Submit logic must convert placeholder values to appropriate database values

## Testing

### Verification Steps

1. **Form Loading**: Lease form loads without console errors
2. **Default State**: Select components show proper placeholder options
3. **Form Reset**: Editing existing leases resets form with correct values
4. **Form Submission**: Submitting form converts placeholder values to null
5. **Data Integrity**: Database receives correct null values for optional fields

### Error Prevention

- No more "Select.Item must have a value prop that is not an empty string" errors
- Consistent behavior across all Select components in the form
- Proper handling of optional/nullable fields

## Best Practices Applied

### 1. **Meaningful Placeholder Values**

- Use descriptive placeholder values that clearly indicate "no selection"
- Avoid generic values like "none" or empty strings

### 2. **Consistent Value Patterns**

- Use consistent naming patterns for placeholder values
- Make placeholder values easily identifiable in code

### 3. **Proper Data Conversion**

- Convert placeholder values to appropriate database values on submission
- Maintain clear separation between UI state and data state

### 4. **Error Prevention**

- Follow Select component requirements strictly
- Test form behavior with all possible states
- Ensure consistent value handling throughout the form lifecycle
