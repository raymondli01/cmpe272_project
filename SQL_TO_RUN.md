# SQL Migration Instructions

## Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `avqqlfbrqmsxegtrdpno`
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**

## Step 2: Copy and Run the Migration

Open the file:
```
supabase/migrations/20251113000001_add_ai_analytics_tables.sql
```

Copy the ENTIRE contents of that file and paste it into the SQL editor, then click **RUN**.

This will create 4 new tables:
- ✅ `ai_analytics` - Dashboard metrics (NRW, uptime, energy)
- ✅ `energy_schedules` - AI-generated pump schedules
- ✅ `demand_forecasts` - 24-hour water demand predictions
- ✅ `system_metrics` - System performance tracking

## Step 3: Verify Tables Were Created

After running the migration, go to **Table Editor** in Supabase and you should see these 4 new tables.

## Step 4: Generate Initial Data

After the tables are created, run this command in your terminal:

```bash
curl -X POST http://localhost:8000/ai/generate-analytics
```

This will:
1. Call OpenAI to generate NRW calculations
2. Calculate system uptime from events
3. Generate 24-hour demand forecast
4. Pull latest energy optimization data
5. Store everything in the new tables

You should see a response like:
```json
{
  "status": "success",
  "nrw": { "nrw_percentage": 12.4, ... },
  "uptime": { "uptime_percentage": 99.7, ... },
  "demand_forecast": { "forecast": [...], ... },
  "energy_metrics": { "daily_savings": 142.50, ... }
}
```

## That's It!

The database is now ready. 

## Troubleshooting

**If you get an error about tables already existing:**
- That's fine! It means the migration already ran. Skip to Step 4.

**If you get an error about permissions:**
- Make sure you're using the service role key in your `.env` file
- Check that RLS policies were created correctly

**If /ai/generate-analytics fails:**
- Check that your OpenAI API key is valid
- Check backend logs for detailed error messages
- Make sure the migration completed successfully
