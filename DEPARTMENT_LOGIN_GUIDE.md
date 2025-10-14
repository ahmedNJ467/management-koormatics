# 🔐 Department Login Guide

## Quick Setup Instructions

### 1. **Run the SQL Script**

Execute the `create_department_test_users.sql` script in your Supabase SQL editor to create test users for each department.

### 2. **Test User Credentials**

All test users use the password: `password123`

| Department     | Email                       | Role                 | Access Level                         |
| -------------- | --------------------------- | -------------------- | ------------------------------------ |
| **Management** | `management@koormatics.com` | `super_admin`        | Full system access + Settings        |
| **Fleet**      | `fleet@koormatics.com`      | `fleet_manager`      | Vehicles, Drivers, Maintenance, etc. |
| **Operations** | `operations@koormatics.com` | `operations_manager` | Dispatch, Trips, Clients, etc.       |
| **Finance**    | `finance@koormatics.com`    | `finance_manager`    | Invoices, Analytics, Contracts, etc. |

## 🌐 How to Access Each Department

### **Method 1: URL-Based Access (Recommended)**

#### **Management Department**

- **URL**: `management-koormatics.vercel.app` or `management.yourdomain.com`
- **Login**: `management@koormatics.com` / `password123`
- **Features**: System settings, user management, analytics

#### **Fleet Department**

- **URL**: `fleet-koormatics.vercel.app` or `fleet.yourdomain.com`
- **Login**: `fleet@koormatics.com` / `password123`
- **Features**: Vehicle management, maintenance, inspections

#### **Operations Department**

- **URL**: `operations-koormatics.vercel.app` or `operations.yourdomain.com`
- **Login**: `operations@koormatics.com` / `password123`
- **Features**: Dispatch center, trip management, client communications

#### **Finance Department**

- **URL**: `finance-koormatics.vercel.app` or `finance.yourdomain.com`
- **Login**: `finance@koormatics.com` / `password123`
- **Features**: Invoice management, cost analytics, financial reports

### **Method 2: Local Development**

For local development, you can simulate different departments by:

1. **Using Environment Variables**:

   ```bash
   # Management
   NEXT_PUBLIC_APP_SUBDOMAIN=management npm run dev

   # Fleet
   NEXT_PUBLIC_APP_SUBDOMAIN=fleet npm run dev

   # Operations
   NEXT_PUBLIC_APP_SUBDOMAIN=operations npm run dev

   # Finance
   NEXT_PUBLIC_APP_SUBDOMAIN=finance npm run dev
   ```

2. **Modifying Hosts File** (Windows):

   ```
   127.0.0.1 management.localhost
   127.0.0.1 fleet.localhost
   127.0.0.1 operations.localhost
   127.0.0.1 finance.localhost
   ```

3. **Access via**:
   - `http://management.localhost:3000`
   - `http://fleet.localhost:3000`
   - `http://operations.localhost:3000`
   - `http://finance.localhost:3000`

## 🔍 What You'll See in Each Department

### **Management Dashboard**

- System health metrics
- User management tools
- Analytics and reports
- **Settings page** (exclusive to management)

### **Fleet Dashboard**

- Vehicle fleet overview
- Maintenance alerts
- Fuel efficiency metrics
- Vehicle status tracking

### **Operations Dashboard**

- Active trips counter
- Available drivers
- Dispatch center
- Security escort management

### **Finance Dashboard**

- Monthly revenue
- Outstanding invoices
- Payment tracking
- Cost analytics

## 🚫 Access Restrictions

- **Settings**: Only accessible to Management department
- **Vehicles**: Only accessible to Fleet department
- **Dispatch**: Only accessible to Operations department
- **Invoices**: Only accessible to Finance department

If you try to access a restricted page, you'll see an "Access Restricted" message.

## 🛠️ Troubleshooting

### **Can't Login?**

1. Make sure you ran the SQL script
2. Check that the user exists in `auth.users` table
3. Verify the user has a profile in `public.profiles`
4. Confirm the user has the correct role in `public.user_roles`

### **Wrong Department Showing?**

1. Check the URL subdomain
2. Verify the `NEXT_PUBLIC_APP_SUBDOMAIN` environment variable
3. Clear browser cache and cookies

### **Access Denied?**

1. Verify the user has the correct role
2. Check the `page_access` table for role permissions
3. Ensure the user's role matches the department requirements

## 📝 Creating Additional Users

To create more users for testing:

```sql
-- Example: Create another fleet manager
INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data)
VALUES ('fleet2@koormatics.com', crypt('password123', gen_salt('bf')), '{"full_name": "Fleet Manager 2"}');

-- Add profile
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users WHERE email = 'fleet2@koormatics.com';

-- Assign role
INSERT INTO public.user_roles (user_id, role_slug)
SELECT u.id, 'fleet_manager'
FROM auth.users u WHERE u.email = 'fleet2@koormatics.com';
```

## 🎯 Testing Checklist

- [ ] Management user can access Settings
- [ ] Fleet user cannot access Settings (shows restriction)
- [ ] Operations user can access Dispatch
- [ ] Finance user can access Invoices
- [ ] Each department shows correct dashboard
- [ ] Sidebar shows only relevant menu items
- [ ] Domain detection works correctly
- [ ] Role-based access control functions properly
