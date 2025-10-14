# Fleet Management System - Koormatics

A comprehensive fleet management solution built with React, TypeScript, and Supabase.

<!-- Updated for Vercel deployment fix -->

## 🚀 New Features

### 📧 PDF Email Quotations ⭐ NEW

- **Professional PDF Generation**: Quotations are automatically generated as professional PDF documents
- **Email Delivery**: PDFs are sent directly to clients via email with beautiful HTML templates
- **Real-time Status Updates**: Quotation status automatically updates when sent
- **Enhanced Analytics**: Dashboard with KPI cards showing quotation metrics and values

## 🎯 Key Features

### 📋 Quotation Management

- Create and manage client quotations
- Professional PDF generation with company branding
- Automatic email delivery with PDF attachments
- VAT and discount calculations
- Real-time analytics and status tracking

### 🚛 Fleet Operations

- Vehicle management and tracking
- Driver profiles and scheduling
- Trip planning and execution
- Real-time dispatch operations

### 💰 Financial Management

- Invoice generation and tracking
- Cost analytics and reporting
- Payment management
- Financial dashboards

### 🔧 Maintenance & Parts

- Maintenance scheduling and tracking
- Spare parts inventory management
- Service history and costs
- Vendor management

### ⛽ Fuel Management

- Fuel consumption tracking
- Cost analysis and efficiency metrics
- Tank management
- Fuel log reporting

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **UI Components**: shadcn/ui
- **State Management**: React Query
- **PDF Generation**: jsPDF (server-side)
- **Email Service**: Resend API
- **Forms**: React Hook Form + Zod validation

## 📧 Email & PDF System

### How It Works

1. **Create Quotation**: Use the enhanced quotation form with auto-calculations
2. **Generate PDF**: Server-side PDF generation with professional formatting
3. **Send Email**: Beautiful HTML email with PDF attachment sent to client
4. **Track Status**: Automatic status updates and real-time analytics

### Features

- Professional PDF templates with company branding
- Responsive HTML email templates
- Automatic attachment handling
- Real-time delivery status
- Client information integration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Resend API key (for email functionality)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd koormatics
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables (for local dev, create `.env.local` in the project root):

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   # For Supabase Edge Functions, set server-only secrets in Supabase, not in .env.local
   # RESEND_API_KEY=your_resend_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # App runs at http://localhost:8080
   ```

### Vercel Deployment

1. Create a new Vercel Project and select this repository
2. Framework Preset: Next.js
3. Environment Variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Optional: `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL`
4. Install Command: `npm ci --legacy-peer-deps`
5. Build Command: `npm run build`
6. Output Directory: `.next`
7. Redeploy

### Supabase Setup

1. **Create a new Supabase project**
2. **Run the database migrations** (located in `/supabase/migrations/`)
3. **Deploy the Edge Functions** (located in `/supabase/functions/`)
4. **Configure Row Level Security (RLS)** policies

### Email Configuration

1. **Sign up for Resend** at [resend.com](https://resend.com)
2. **Get your API key** from the Resend dashboard
3. **Add the API key** to your Supabase environment variables
4. **Verify your domain** (optional, for custom email addresses)

## 📱 Usage

### Sending PDF Quotations

1. **Navigate to Quotations** page
2. **Create New Quotation** or edit existing one
3. **Fill in client details** and quotation items
4. **Save the quotation**
5. **Click "Send PDF to Client"** to email the PDF
6. **Monitor status** in the analytics dashboard

### Key Benefits

- ✅ Professional appearance with branded PDFs
- ✅ Automated email delivery
- ✅ Real-time status tracking
- ✅ Enhanced client experience
- ✅ Reduced manual work

## 🎨 UI/UX Highlights

- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Responsive Layout**: Works perfectly on desktop and mobile
- **Real-time Updates**: Live data with Supabase subscriptions
- **Enhanced Forms**: Smart validation and auto-calculations
- **Analytics Dashboard**: KPI cards and visual metrics
- **Loading States**: Smooth user experience with proper feedback

## 🔒 Security

- Row Level Security (RLS) policies
- Authentication and authorization
- Data validation and sanitization
- Secure API endpoints
- Environment-based configuration

## 📊 Analytics & Reporting

- Real-time quotation analytics
- Financial reporting and dashboards
- Trip and driver performance metrics
- Cost analysis and trends
- Maintenance and fuel efficiency reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the implementation summary

---

**Built with ❤️ for efficient fleet management**

🚛 **Koormatics** - Your trusted fleet management partner

## 📚 Full Documentation

Looking for in-depth guides? Head over to the 🤓 [docs directory](../docs/) for complete setup, architecture, and API details.
