# Send SMS Function

This Supabase Edge Function sends SMS messages to drivers using Twilio.

## Setup

1. **Get Twilio Credentials:**
   - Sign up for a Twilio account at https://www.twilio.com
   - Get your Account SID and Auth Token from the Twilio Console
   - Get a Twilio phone number (or use a trial number)

2. **Set Environment Variables in Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > Edge Functions > Secrets
   - Add the following secrets:
     - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
     - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
     - `TWILIO_PHONE_NUMBER`: Your Twilio phone number (e.g., +1234567890)

3. **Deploy the Function:**
   ```bash
   supabase functions deploy send-sms
   ```

## Usage

The function is called automatically from the chat interface when:
- A driver is selected
- The "Also send as SMS" toggle is enabled
- A message is sent

### Request Body:
```json
{
  "to": "+1234567890",
  "message": "Your message text",
  "driver_id": "uuid-here",
  "trip_id": "uuid-here"
}
```

### Response:
```json
{
  "success": true,
  "message_sid": "SM...",
  "to": "+1234567890"
}
```

## Notes

- Phone numbers should be in E.164 format (e.g., +1234567890)
- The function will automatically format phone numbers if needed
- If Twilio credentials are not configured, the function returns a 503 error but doesn't break the chat functionality
- SMS sending failures don't prevent the in-app message from being sent

