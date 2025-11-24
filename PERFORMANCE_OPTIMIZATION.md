# Performance Optimization Guide

This guide outlines performance optimizations implemented and recommendations for further improvements.

## ✅ Completed Optimizations

### 1. Next.js Configuration
- Enhanced webpack code splitting
- Separate chunks for React, UI libraries, and charts
- Optimized bundle sizes
- Image optimization with WebP/AVIF support

### 2. React Query Optimization
- Created optimized query hooks with better defaults
- Reduced unnecessary refetches
- Better cache management
- Stale-while-revalidate patterns

### 3. Code Splitting
- Dynamic imports for heavy components (charts)
- Lazy loading for routes
- Component-level code splitting

## 📊 Bundle Analysis

### Setup Bundle Analyzer

1. Install the analyzer:
```bash
npm install --save-dev @next/bundle-analyzer
```

2. Update `next.config.js`:
```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

3. Run analysis:
```bash
ANALYZE=true npm run build
```

### Current Bundle Size Targets

- **Initial JS**: < 200KB (gzipped)
- **Total JS**: < 500KB (gzipped)
- **CSS**: < 50KB (gzipped)
- **Images**: Optimized with WebP/AVIF

## 🎯 Optimization Strategies

### 1. Reduce Bundle Size

#### Icon Optimization
```tsx
// ❌ Bad: Importing entire icon library
import * as Icons from "lucide-react";

// ✅ Good: Tree-shakeable imports
import { Car, Users } from "lucide-react";
```

#### Dynamic Imports
```tsx
// ✅ Lazy load heavy components
const HeavyChart = dynamic(() => import("./HeavyChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

#### Library Alternatives
- Consider lighter alternatives for heavy libraries
- Use native browser APIs where possible
- Remove unused dependencies

### 2. Database Query Optimization

#### Add Indexes
```sql
-- Example: Add indexes for frequently queried columns
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_trips_date ON trips(date);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
```

#### Select Only Needed Fields
```tsx
// ❌ Bad: Selecting all fields
const { data } = await supabase.from("vehicles").select("*");

// ✅ Good: Select only needed fields
const { data } = await supabase
  .from("vehicles")
  .select("id, make, model, status");
```

#### Use Pagination
```tsx
// ✅ Paginate large queries
const { data } = await supabase
  .from("vehicles")
  .select("*")
  .range(0, 49); // First 50 items
```

#### Query Optimization Checklist
- [ ] Add indexes on frequently filtered/sorted columns
- [ ] Use `.select()` to limit returned fields
- [ ] Implement pagination for large datasets
- [ ] Use `.single()` or `.maybeSingle()` when expecting one result
- [ ] Avoid N+1 queries with proper joins
- [ ] Use database views for complex queries

### 3. Image Optimization

#### Use Next.js Image Component
```tsx
import Image from "next/image";

<Image
  src="/logo.svg"
  alt="Logo"
  width={200}
  height={200}
  priority // For above-the-fold images
  loading="lazy" // For below-the-fold images
/>
```

#### Image Optimization Checklist
- [ ] Convert images to WebP/AVIF
- [ ] Use appropriate image sizes
- [ ] Lazy load below-the-fold images
- [ ] Use `priority` for critical images
- [ ] Optimize image dimensions

### 4. Chart Optimization

#### Lazy Load Charts
```tsx
const Chart = dynamic(() => import("./Chart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

#### Virtual Scrolling for Large Datasets
```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

// Use virtual scrolling for large lists
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

### 5. React Optimization

#### Memoization
```tsx
// Memoize expensive components
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething();
}, [dependencies]);
```

#### Code Splitting at Route Level
```tsx
// Use dynamic imports for routes
const Dashboard = dynamic(() => import("@/pages/Dashboard"), {
  loading: () => <DashboardSkeleton />,
});
```

## 📈 Performance Metrics

### Lighthouse Targets

- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 95+

### Core Web Vitals

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Monitoring

1. **Chrome DevTools**
   - Performance tab for profiling
   - Network tab for bundle analysis
   - Lighthouse for audits

2. **Next.js Analytics**
   - Enable in `next.config.js`
   - Monitor real user metrics

3. **Custom Monitoring**
   - Track page load times
   - Monitor API response times
   - Track error rates

## 🔧 Quick Wins

1. **Remove unused dependencies**
   ```bash
   npm prune
   ```

2. **Enable compression**
   ```js
   // Already enabled in next.config.js
   compress: true
   ```

3. **Optimize fonts**
   ```tsx
   // Use next/font for automatic optimization
   import { Inter } from "next/font/google";
   ```

4. **Reduce re-renders**
   - Use React.memo for expensive components
   - Use useMemo/useCallback appropriately
   - Avoid creating objects/functions in render

5. **Optimize images**
   - Use Next.js Image component
   - Convert to WebP/AVIF
   - Lazy load below the fold

## 📝 Performance Checklist

### Before Production

- [ ] Run bundle analyzer
- [ ] Optimize images
- [ ] Add database indexes
- [ ] Enable compression
- [ ] Test on slow 3G
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Test on mobile devices
- [ ] Monitor error rates
- [ ] Set up performance monitoring

### Ongoing

- [ ] Monitor bundle size
- [ ] Review slow queries
- [ ] Optimize images regularly
- [ ] Update dependencies
- [ ] Review performance metrics
- [ ] A/B test optimizations

## 🚀 Next Steps

1. **Run Bundle Analyzer**
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ANALYZE=true npm run build
   ```

2. **Add Database Indexes**
   - Review slow queries
   - Add indexes for frequently filtered columns
   - Monitor query performance

3. **Optimize Images**
   - Convert existing images to WebP
   - Use Next.js Image component
   - Implement lazy loading

4. **Monitor Performance**
   - Set up performance monitoring
   - Track Core Web Vitals
   - Review metrics regularly

