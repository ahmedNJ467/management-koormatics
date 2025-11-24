# Performance Monitoring Guide

This guide helps you monitor and optimize the performance of the Koormatics Management System.

## 📊 Bundle Analysis

### Setup

1. **Install bundle analyzer** (if not already installed):
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ```

2. **Run bundle analysis**:
   ```bash
   npm run analyze
   ```

   This will:
   - Build your application
   - Open a browser window with interactive bundle visualization
   - Show the size of each dependency and chunk

### Understanding the Results

- **Large chunks (>200KB)**: Consider code splitting or lazy loading
- **Duplicate dependencies**: Check for multiple versions of the same package
- **Unused code**: Look for opportunities to tree-shake
- **Heavy libraries**: Consider lighter alternatives

### Optimization Strategies

1. **Dynamic Imports**: Lazy load heavy components
   ```tsx
   const HeavyChart = dynamic(() => import('./HeavyChart'), {
     ssr: false,
     loading: () => <ChartSkeleton />
   });
   ```

2. **Tree Shaking**: Import only what you need
   ```tsx
   // ❌ Bad
   import * as Icons from 'lucide-react';
   
   // ✅ Good
   import { Car, Users } from 'lucide-react';
   ```

3. **Remove Unused Dependencies**:
   ```bash
   npm prune
   ```

## 🎯 Lighthouse Audit

### Running Lighthouse

1. **Chrome DevTools**:
   - Open Chrome DevTools (F12)
   - Go to "Lighthouse" tab
   - Select "Performance" category
   - Click "Analyze page load"

2. **CLI** (if installed):
   ```bash
   lighthouse http://localhost:8080 --view
   ```

### Performance Targets

- **Performance Score**: 90+
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Large JavaScript bundles | Code splitting, lazy loading |
| Render-blocking resources | Defer non-critical CSS/JS |
| Unused CSS | Remove unused styles, use CSS modules |
| Large images | Optimize images, use WebP/AVIF |
| Slow server response | Optimize API queries, add caching |

## 📈 Core Web Vitals

### Monitoring

1. **Chrome DevTools**:
   - Performance tab → Record → Reload page
   - Check Web Vitals in the timeline

2. **Real User Monitoring**:
   - Consider using services like Vercel Analytics
   - Or implement custom tracking

### Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

## 🔍 Database Performance

### Query Monitoring

1. **Supabase Dashboard**:
   - Go to Database → Query Performance
   - Review slow queries
   - Check query execution plans

2. **Add Indexes**:
   - Run `SUPABASE_INDEXES_SAFE.sql`
   - Monitor query performance after adding indexes

### Optimization Checklist

- [ ] Add indexes for frequently filtered columns
- [ ] Use `.select()` to limit returned fields
- [ ] Implement pagination for large datasets
- [ ] Avoid N+1 queries
- [ ] Use database views for complex queries

## 🚀 Performance Audit Checklist

Run the performance audit script:

```bash
npm run perf:audit
```

This will display a comprehensive checklist covering:
- Bundle size optimization
- Database query optimization
- Image optimization
- React optimization
- Caching strategies
- Testing requirements

## 📝 Regular Monitoring

### Weekly

- [ ] Review bundle sizes
- [ ] Check for new large dependencies
- [ ] Review slow database queries
- [ ] Check error rates

### Monthly

- [ ] Run full Lighthouse audit
- [ ] Review Core Web Vitals
- [ ] Analyze user performance metrics
- [ ] Update dependencies
- [ ] Review and optimize images

### Before Major Releases

- [ ] Complete performance audit
- [ ] Run bundle analyzer
- [ ] Test on slow 3G
- [ ] Test on mobile devices
- [ ] Review all performance metrics
- [ ] Optimize based on findings

## 🛠️ Tools & Resources

### Built-in Tools

- **Next.js Analytics**: Built-in performance monitoring
- **React DevTools Profiler**: Component performance analysis
- **Chrome DevTools**: Network, Performance, Lighthouse tabs

### External Tools

- **WebPageTest**: Detailed performance analysis
- **GTmetrix**: Performance testing and monitoring
- **Google PageSpeed Insights**: Performance recommendations

### Documentation

- `PERFORMANCE_OPTIMIZATION.md` - Detailed optimization guide
- `REDESIGN_PROGRESS.md` - Progress tracking
- `TABLE_MIGRATION_GUIDE.md` - Table optimization

## 🎯 Quick Wins

1. **Enable Compression**: Already configured in `next.config.js`
2. **Optimize Images**: Use Next.js Image component
3. **Add Database Indexes**: Run `SUPABASE_INDEXES_SAFE.sql`
4. **Lazy Load Charts**: Use dynamic imports
5. **Remove Unused Code**: Run `npm prune`

## 📊 Performance Metrics Dashboard

Consider creating a dashboard to track:
- Page load times
- API response times
- Error rates
- Bundle sizes over time
- Database query performance
- User engagement metrics

## 🔄 Continuous Improvement

1. **Set Baselines**: Establish current performance metrics
2. **Set Targets**: Define performance goals
3. **Monitor Regularly**: Track metrics over time
4. **Optimize Incrementally**: Make small, measurable improvements
5. **Measure Impact**: Verify improvements with metrics

---

**Remember**: Performance optimization is an ongoing process. Regular monitoring and incremental improvements will keep your application fast and responsive.

