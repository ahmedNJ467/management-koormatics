# Interest Points Setup Guide

## Current Issues
The interest points feature is experiencing connection errors due to missing environment configuration.

## Required Environment Variables

You need to create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## How to Get These Values

### 1. Go to Your Supabase Dashboard
- Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project

### 2. Get the URL
- Go to **Settings** → **API**
- Copy the **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)

### 3. Get the Anon Key
- In the same **Settings** → **API** section
- Copy the **anon public** key (starts with `eyJ...`)

### 4. Create the Environment File
- In your project root directory, create a file named `.env.local`
- Add the values you copied:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Setup

### 1. Run the Migration
- Go to your Supabase dashboard
- Navigate to **SQL Editor**
- Copy and paste the contents of `CREATE_INTEREST_POINTS_TABLE.sql`
- Click **Run** to execute the migration

### 2. Verify the Table
- Go to **Table Editor**
- You should see a new `interest_points` table
- It should contain 8 sample records

## Restart Your Development Server

After setting up the environment variables:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
# or
yarn dev
```

## Troubleshooting

### Error: "Authentication error: Please check your Supabase credentials"
- Verify your `.env.local` file exists and has the correct values
- Make sure there are no extra spaces or quotes around the values
- Restart your development server

### Error: "Database table not found: Please run the interest points migration first"
- Run the SQL migration in your Supabase dashboard
- Verify the `interest_points` table exists in Table Editor

### Error: "Network error: Please check your internet connection and Supabase URL"
- Check your internet connection
- Verify the Supabase URL is correct
- Ensure your Supabase project is active and not paused

### Realtime Channel Errors
- These are usually temporary and resolve automatically
- If persistent, check your Supabase project status
- Verify your project hasn't exceeded usage limits

## Testing the Feature

1. Navigate to the **Dispatch** page
2. Click on the **Interest Points** tab
3. You should see the list of interest points
4. Click on the **Map** tab to see the points on the map
5. Try adding a new interest point by clicking on the map

## Professional Icons

The map now displays professional SVG icons instead of emojis:
- **Airport**: Blue airplane icon
- **Port**: Teal ship icon  
- **Market**: Orange shopping cart icon
- **City**: Green building icon
- **Security**: Red shield icon
- **Fuel**: Yellow gas pump icon
- **Health**: Purple cross icon
- **Restaurant**: Pink fork and knife icon
- **Hotel**: Green hotel icon
- **Bank**: Teal bank icon
- **School**: Orange school icon
- **Mosque**: Purple mosque icon
- **General**: Gray location pin icon

## Support

If you continue to experience issues:
1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure the database migration was successful
4. Check your Supabase project status and billing
