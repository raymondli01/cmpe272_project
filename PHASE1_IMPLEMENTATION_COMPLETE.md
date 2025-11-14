# 🎉 Phase 1 Complete: AI-Driven Incident Detection

## ✅ What's Been Implemented

### Backend Changes:

1. **Leak Preemption Agent Enhanced** (`backend/ai_agents/leak_preemption_agent.py`)
   - ✅ Now automatically creates incidents when confidence > 70%
   - ✅ Calculates priority score (0-100) based on confidence + urgency
   - ✅ Maps urgency to severity (immediate→critical, soon→high, monitor→medium)
   - ✅ Stores full AI reasoning, sensor indicators, and recommendations in metadata
   - ✅ Prints confirmation message when incident created

2. **Database Migration** (`supabase/migrations/20251113000002_add_ai_incident_fields.sql`)
   - ✅ Added `metadata` (JSONB) - Stores AI detection details
   - ✅ Added `detected_by` (TEXT) - Which agent detected it
   - ✅ Added `confidence` (FLOAT) - AI confidence score (0.0-1.0)
   - ✅ Added `priority` (INTEGER) - Priority score (0-100)
   - ✅ Added indexes for fast sorting by priority

### Frontend Changes:

3. **Incidents UI Enhanced** (`frontend/src/pages/Incidents.tsx`)
   - ✅ Shows "AI Detected" badge for AI-generated incidents
   - ✅ Blue left border for AI incidents
   - ✅ Priority badge with color coding (red=critical, orange=high, yellow=medium, blue=low)
   - ✅ Expandable "AI Detection Details" panel showing:
     - Confidence score
     - Priority level
     - Sensor indicators (acoustic, pressure, flow)
     - AI reasoning
     - Recommended actions (valves to close, dispatch crew)
     - Which agent detected it
   - ✅ Incidents sorted by priority (highest first)

---

## 🚀 Step-by-Step Testing Guide

### Step 1: Run the SQL Migration

**IMPORTANT**: You must run this migration first!

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of:
   ```
   supabase/migrations/20251113000002_add_ai_incident_fields.sql
   ```
3. Paste and click **RUN**

**Expected Output**:
```
Success. No rows returned
```

This adds the new AI fields to your `events` table.

---

### Step 2: Verify Backend is Running

Check that the backend reloaded successfully:

```bash
# Check backend logs
curl http://localhost:8000/
```

**Expected Output**:
```json
{"status": "ok", "message": "AWARE Water Management System API"}
```

---

### Step 3: Trigger Leak Detection

Run the Leak Preemption Agent to analyze sensor data and create incidents:

```bash
curl -X POST http://localhost:8000/ai/leak-detection
```

**Expected Output** (example):
```json
{
  "status": "success",
  "leaks_detected": [
    {
      "edge_id": "abc123...",
      "confidence": 0.85,
      "urgency": "immediate",
      "reasoning": "Pressure dropped 15 psi while acoustic sensors detected 8.2 dB spike...",
      "sensor_indicators": {
        "acoustic": "high - 8.2 dB spike detected",
        "pressure": "low - dropped to 50 psi from 65 psi",
        "flow": "normal"
      },
      "recommendation": {
        "action": "isolate",
        "valves_to_close": ["V-12", "V-45"],
        "dispatch_crew": true
      }
    }
  ],
  "actionable_leaks": [...],
  "incidents_created": 1,  ← NEW: How many incidents were auto-created
  "confidence_threshold": 0.84,
  "auto_create_threshold": 0.70,
  "pipes_analyzed": 15
}
```

**In Backend Terminal**, you should see:
```
✓ Created incident for leak at abc123... (confidence: 0.85, priority: 92)
```

---

### Step 4: Verify Incident in Supabase

1. Go to **Supabase Dashboard** → **Table Editor** → **events**
2. You should see a new incident with:
   - ✅ `detected_by`: "Leak Preemption Agent"
   - ✅ `confidence`: 0.85
   - ✅ `priority`: 92 (or similar high value)
   - ✅ `severity`: "critical" or "high"
   - ✅ `metadata`: JSON object with sensor_indicators, reasoning, recommendation

---

### Step 5: Check Incidents Dashboard

1. Open your browser: **http://localhost:5173/incidents**
2. Refresh the page

**What You Should See**:

```
┌─────────────────────────────────────────────────────────────┐
│ 🧠 AI Detected: Potential leak at Pipe abc123...            │
│ [AI Detected Badge] [Priority: 92] [Critical] [Open]        │
│                                                              │
│ Confidence: 85%                                              │
│                                                              │
│ ╭─────────────────────────────────────────────────────────╮ │
│ │ 🧠 AI Detection Details        [Show Details ▼]         │ │
│ │                                                          │ │
│ │ Confidence: 85%                                          │ │
│ │ Priority Level: Critical Priority                        │ │
│ │                                                          │ │
│ │ [Click "Show Details" to expand full explainability]    │ │
│ ╰─────────────────────────────────────────────────────────╯ │
│                                                              │
│ [Acknowledge Button]                                         │
└─────────────────────────────────────────────────────────────┘
```

3. **Click "Show Details"** to see:
   - **Sensor Indicators**:
     - 💧 Acoustic: "high - 8.2 dB spike detected"
     - 🎛️ Pressure: "low - dropped to 50 psi from 65 psi"
     - 📈 Flow: "normal"
   - **AI Reasoning**: Full explanation of why leak was detected
   - **Recommended Actions**:
     - Action: isolate
     - Valves to close: V-12, V-45
     - ⚠️ Dispatch maintenance crew immediately
   - **Detected by**: Leak Preemption Agent

---

## 🎯 Priority Scoring Explained

The priority score (0-100) is calculated as:

```
Priority = (Confidence × 50) + Urgency Bonus

Urgency Bonuses:
- immediate: +50 points → Severity: CRITICAL
- soon: +30 points      → Severity: HIGH
- monitor: +10 points   → Severity: MEDIUM
```

**Examples**:
- Confidence 0.85 + immediate urgency = 42.5 + 50 = **92** (Critical Priority)
- Confidence 0.75 + soon urgency = 37.5 + 30 = **67** (High Priority)
- Confidence 0.70 + monitor urgency = 35 + 10 = **45** (Medium Priority)

Incidents are sorted by priority (highest first), so critical leaks appear at the top!

---

## 🐛 Troubleshooting

### Backend Issues:

**Error: "column metadata does not exist"**
- **Solution**: Run the SQL migration (Step 1)

**No incidents created (incidents_created: 0)**
- **Possible causes**:
  1. No leaks detected (all sensors look normal)
  2. Confidence below 70% threshold
  3. No sensor data available
- **Solution**: Check sensor data or manually create anomalous sensor readings for testing

**Error inserting into events table**
- **Solution**: Check backend logs for detailed error message

### Frontend Issues:

**"AI Detected" badge not showing**
- **Cause**: Old incidents don't have `detected_by` field
- **Solution**: Only new incidents (created after migration) will show the badge

**Priority badge showing "undefined"**
- **Cause**: Old incidents don't have `priority` field
- **Solution**: Only new AI-detected incidents have priority scores

**"Show Details" button does nothing**
- **Cause**: `metadata` field is empty or null
- **Solution**: Check that backend is storing metadata properly

---

## 📊 Testing with Mock Data

If you want to test without waiting for real leak detection, you can manually insert a test incident:

```sql
INSERT INTO events (
  kind, severity, state, title, description,
  detected_by, confidence, priority, metadata
) VALUES (
  'leak',
  'critical',
  'open',
  'AI Detected: Test leak at Pipe TEST-123',
  'Confidence: 92%\n\nThis is a test incident with mock AI detection data.',
  'Leak Preemption Agent',
  0.92,
  96,
  '{
    "sensor_indicators": {
      "acoustic": "high - 8.2 dB spike detected at 14:23:15",
      "pressure": "low - dropped to 48 psi from 65 psi in 30 seconds",
      "flow": "high - unexpected 15% increase"
    },
    "reasoning": "Multiple correlated anomalies detected: significant pressure drop coinciding with acoustic spike and flow increase. Pattern consistent with pipe rupture or major leak. Immediate isolation recommended to prevent water loss and potential flooding.",
    "recommendation": {
      "action": "isolate",
      "valves_to_close": ["V-12", "V-45", "V-67"],
      "dispatch_crew": true,
      "estimated_location": "Between junctions J-45 and J-46"
    },
    "urgency": "immediate",
    "detection_timestamp": "2025-11-13T20:23:15.000Z"
  }'::jsonb
);
```

Refresh the Incidents page and you should see this test incident with full AI details!

---

## ✅ Success Criteria

Phase 1 is complete when:

- [x] Leak Preemption Agent automatically creates incidents
- [x] Priority scoring works (0-100 scale)
- [x] Severity mapping works (urgency → severity)
- [x] Incidents UI shows "AI Detected" badge
- [x] Explainability panel shows sensor indicators
- [x] Explainability panel shows AI reasoning
- [x] Explainability panel shows recommendations
- [x] Incidents sorted by priority (highest first)
- [ ] **YOU VERIFY**: Run migration in Supabase ← DO THIS NEXT
- [ ] **YOU VERIFY**: Test leak detection end-to-end ← THEN THIS

---

## 🚀 Next Steps (Phase 2)

After you verify Phase 1 works:

1. **Valve Isolation Recommendations**
   - Simulate multiple valve closure sequences
   - Rank by customer impact, isolation time
   - Show top 3 options with pros/cons

2. **Continuous Monitoring**
   - Run agents on schedule (every 5 minutes)
   - Background job to auto-detect leaks
   - Real-time incident creation

3. **Enhanced Prioritization**
   - Factor in number of customers affected
   - Factor in estimated water loss (gallons/minute)
   - Factor in safety risk (proximity to critical infrastructure)

Let me know when you're ready for Phase 2! 🎉
