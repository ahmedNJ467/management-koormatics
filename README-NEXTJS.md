# Koormatics Management System - Next.js Version

This project has been converted from Vite to Next.js full-stack framework.

## What Changed

### Architecture
- **Frontend**: Converted from Vite + React Router to Next.js App Router
- **Backend**: Added Next.js API routes for server-side functionality
- **Routing**: Migrated from React Router to Next.js file-based routing

### File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── auth/              # Authentication routes
│   │   └── page.tsx
│   ├── [...slug]/         # Dynamic routes for all pages
│   │   └── page.tsx
│   └── api/               # API routes
│       └── route.ts
├── components/             # React components (unchanged)
├── routes/                # Page components (unchanged)
├── lib/                   # Utilities (unchanged)
└── types/                 # TypeScript types (unchanged)
```

### Key Features
- **Server-Side Rendering**: Better SEO and performance
- **API Routes**: Built-in backend API endpoints
- **File-based Routing**: Automatic route generation
- **TypeScript Support**: Full TypeScript integration
- **Tailwind CSS**: Styled with utility-first CSS framework

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   - Copy `env.example` to `.env.local`
   - Add your Supabase credentials

3. **Development**:
   ```bash
   npm run dev
   ```

4. **Build**:
   ```bash
   npm run build
   npm start
   ```

## Migration Notes

- All existing components and functionality preserved
- React Router replaced with Next.js navigation
- Vite build system replaced with Next.js build system
- Supabase integration maintained
- All UI components and styling preserved

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript check

## Port Configuration

The application runs on port 8080 by default, maintaining the same port as the original Vite setup.
