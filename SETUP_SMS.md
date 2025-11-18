# SMS Setup Guide

## Quick Setup Steps

### 1. Get Twilio Credentials

1. Sign up at https://www.twilio.com (free trial available)
2. Go to Console Dashboard
3. Copy your:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)
   - **Phone Number** (get one from Phone Numbers > Manage > Buy a number)

### 2. Set Secrets in Supabase

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add these three secrets:
   - Name: `TWILIO_ACCOUNT_SID`, Value: `ACxxxxxxxxxxxxx`
   - Name: `TWILIO_AUTH_TOKEN`, Value: `your_auth_token_here`
   - Name: `TWILIO_PHONE_NUMBER`, Value: `+1234567890` (with country code)

**Option B: Via Supabase CLI**
```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Deploy the Function

**Via Supabase CLI:**
```bash
cd supabase/functions/send-sms
supabase functions deploy send-sms
```

**Or via Supabase Dashboard:**
1. Go to **Edge Functions** in your dashboard
2. Click **Deploy new function**
3. Upload the `supabase/functions/send-sms` folder

### 4. Test It

1. Open the Chat page in your app
2. Select a driver with a phone number
3. Enable "Also send as SMS" toggle
4. Send a test message
5. Check the driver's phone - they should receive the SMS!

## Troubleshooting

### SMS not sending?
1. **Check Twilio credentials are correct** in Supabase secrets
2. **Verify phone number format** - should be E.164 format (+1234567890)
3. **Check Twilio console** for error logs
4. **Verify function is deployed** - check Supabase Edge Functions dashboard
5. **Check browser console** for error messages

### "SMS service not configured" error?
- Make sure all three secrets are set in Supabase
- Redeploy the function after setting secrets

### Trial account limitations?
- Twilio trial accounts can only send to verified numbers
- Verify your test numbers in Twilio Console → Phone Numbers → Verified Caller IDs

## Cost

- Twilio pricing: ~$0.0075 per SMS in US
- Free trial includes $15.50 credit
- Check https://www.twilio.com/pricing for your region

## Security Notes

- Never commit Twilio credentials to git
- Secrets are stored securely in Supabase
- Function requires authentication to call
- Only authenticated users can send SMS

