# AI Agents Implementation Guide

## Overview

The AWARE Water Management System now includes three specialized AI agents powered by OpenAI GPT-4:

1. **Leak Preemption Agent** - Predictive leak detection using sensor fusion
2. **Energy Optimizer Agent** - Pump/tank scheduling optimization
3. **Safety Monitor Agent** - Continuous pressure and safety monitoring

All agents provide explainability, confidence scoring, and actionable recommendations.

## Architecture

```
backend/
├── ai_agents/
│   ├── __init__.py
│   ├── supabase_client.py         # Supabase REST API client
│   ├── leak_preemption_agent.py    # Leak detection agent
│   ├── energy_optimizer_agent.py   # Energy optimization agent
│   ├── safety_monitor_agent.py     # Safety monitoring agent
│   └── agent_coordinator.py        # Multi-agent orchestration
└── main.py                         # FastAPI with AI endpoints
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Dependencies include:
- `openai` - OpenAI API client
- `httpx` - Async HTTP client for Supabase
- `python-dotenv` - Environment variable management
- `fastapi` - Web framework
- `uvicorn` - ASGI server

### 2. Create Agent Decisions Table (REQUIRED)

The `agent_decisions` table is required for storing AI recommendations and audit trails.

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to https://supabase.com/dashboard
2. Select your project: `avqqlfbrqmsxegtrdpno`
3. Navigate to SQL Editor
4. Copy and paste the contents of `supabase/migrations/20251113000000_add_agent_decisions.sql`
5. Click "Run"

**Option B: Via psql (if installed)**

```bash
psql "$DATABASE_URL" -f supabase/migrations/20251113000000_add_agent_decisions.sql
```

### 3. Verify Environment Variables

Ensure your `.env` file contains:

```bash
SUPABASE_URL="https://avqqlfbrqmsxegtrdpno.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
OPENAI_API_KEY="your-openai-api-key"
DATABASE_URL="postgresql://..."
```

### 4. Start the Backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### AI Agent Endpoints

All AI endpoints use POST requests:

#### 1. Run All Agents (Coordinated)
```bash
POST http://localhost:8000/ai/analyze
```

Runs all three agents in coordinated mode:
- Safety Monitor (priority 1)
- Leak Preemption (priority 2)
- Energy Optimizer (priority 3)

Returns coordinated recommendations with conflict resolution.

**Example Response:**
```json
{
  "status": "success",
  "results": {
    "safety": { ... },
    "leak_detection": { ... },
    "energy_optimization": { ... }
  },
  "coordinated_actions": {
    "immediate_actions": [...],
    "scheduled_actions": [...],
    "conflicts": [...]
  }
}
```

#### 2. Leak Detection Only
```bash
POST http://localhost:8000/ai/leak-detection
```

Analyzes sensor data (acoustic + pressure + flow) to detect potential leaks.

**Key Features:**
- Sensor fusion from multiple data sources
- Confidence threshold: 0.84 (84%)
- Provides reasoning and valve isolation recommendations
- Urgency classification (immediate/soon/monitor)

**Example Response:**
```json
{
  "status": "success",
  "leaks_detected": [
    {
      "edge_id": "uuid",
      "confidence": 0.92,
      "urgency": "immediate",
      "reasoning": "High acoustic readings (2.8 dB) combined with abnormal flow...",
      "sensor_indicators": {
        "acoustic": "high - indicating vibrations",
        "pressure": "normal",
        "flow": "high - unexpected flow rate"
      },
      "recommendation": {
        "action": "isolate",
        "valves_to_close": ["V1"],
        "dispatch_crew": true,
        "estimated_location": "Between nodes N1 and N2"
      }
    }
  ],
  "actionable_leaks": [...],  // Only leaks >= 0.84 confidence
  "confidence_threshold": 0.84
}
```

#### 3. Energy Optimization Only
```bash
POST http://localhost:8000/ai/energy-optimization
```

Creates optimal 24-hour pump schedules based on energy prices.

**Key Features:**
- Day-ahead pricing integration
- Pressure floor constraints (minimum 40 psi)
- Estimated cost savings
- Risk assessment

**Example Response:**
```json
{
  "status": "success",
  "optimizations": [
    {
      "pump_name": "PUMP1",
      "schedule": [
        {
          "hour": 0,
          "status": "off",
          "setpoint": 50,
          "rationale": "Off-peak pricing starts at hour 2, run then"
        }
      ],
      "estimated_daily_savings_usd": 12.50,
      "confidence": 0.95,
      "reasoning": "Schedule optimizes for off-peak hours while maintaining pressure..."
    }
  ],
  "overall_strategy": "Run pumps during off-peak hours (2am-6am, 10pm-12am)",
  "total_estimated_savings": 25.00
}
```

#### 4. Safety Monitoring Only
```bash
POST http://localhost:8000/ai/safety-monitoring
```

Monitors system for safety violations with zero tolerance.

**Safety Thresholds:**
- Critical Low: < 30 psi (EMERGENCY)
- Safe Min: 40 psi
- Safe Max: 120 psi

**Example Response:**
```json
{
  "status": "success",
  "safety_status": "SAFE",  // or "WARNING" or "CRITICAL"
  "issues": [],
  "critical_issues": [],
  "high_issues": [],
  "overall_assessment": "All systems operating within safe parameters",
  "monitoring_recommendations": [
    "Continue monitoring pressure at node N3"
  ]
}
```

### Legacy Endpoints (Still Available)

```bash
GET http://localhost:8000/sensors      # Real sensor data from Supabase
GET http://localhost:8000/leaks        # Simple rule-based leak detection
```

## Agent Behavior

### 1. Leak Preemption Agent

**Input:** Acoustic, pressure, and flow sensor readings

**Process:**
1. Fetches all edge (pipe) sensors
2. Groups by edge_id
3. Constructs detailed prompt with sensor data
4. OpenAI analyzes patterns
5. Returns leak predictions with confidence scores

**Confidence Scoring:**
- < 0.84: Monitoring recommended
- >= 0.84: Actionable - requires human approval
- >= 0.95: Critical - immediate action

### 2. Energy Optimizer Agent

**Input:** Energy prices, pump status, pressure sensors

**Process:**
1. Fetches 24-hour energy price forecast
2. Gets current pump/valve configurations
3. Calculates current average pressure
4. OpenAI creates optimal schedule
5. Ensures pressure constraints are met

**Guardrails:**
- Minimum pressure: 40 psi (hard constraint)
- Pump cycling limits (wear prevention)
- Continuous water availability

### 3. Safety Monitor Agent

**Input:** All sensor readings, valves, pumps

**Process:**
1. Fetches all sensors
2. Checks against safety thresholds
3. OpenAI analyzes for violations and anomalies
4. Returns categorized issues

**Priority Levels:**
- CRITICAL: Immediate action required
- HIGH: Action required soon
- MEDIUM: Monitor closely
- LOW: Note for future reference

### 4. Agent Coordinator

**Orchestration Logic:**
1. Always run Safety Monitor first
2. If CRITICAL safety issues → skip other agents
3. Run Leak Detection
4. If critical leaks (> 0.95) → skip energy optimization
5. Otherwise run Energy Optimizer
6. Coordinate and resolve conflicts

**Conflict Resolution:**
- Safety > Leaks > Energy
- Provides explanation for any deferred actions

## Testing the AI Agents

### Using curl

```bash
# Test leak detection
curl -X POST http://localhost:8000/ai/leak-detection | jq

# Test energy optimization
curl -X POST http://localhost:8000/ai/energy-optimization | jq

# Test safety monitoring
curl -X POST http://localhost:8000/ai/safety-monitoring | jq

# Run all agents (coordinated)
curl -X POST http://localhost:8000/ai/analyze | jq
```

### Using Python

```python
import httpx
import asyncio

async def test_agents():
    async with httpx.AsyncClient() as client:
        # Run all agents
        response = await client.post("http://localhost:8000/ai/analyze")
        result = response.json()

        print("Safety Status:", result["results"]["safety"]["safety_status"])
        print("Leaks Found:", len(result["results"]["leak_detection"]["leaks_detected"]))
        print("Immediate Actions:", len(result["coordinated_actions"]["immediate_actions"]))

asyncio.run(test_agents())
```

## Database Schema

The `agent_decisions` table stores all AI recommendations:

```sql
CREATE TABLE agent_decisions (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  decision_type TEXT,              -- 'leak_detection', 'energy_optimization', 'safety_violation'
  input_data JSONB,                -- Sensor data used
  reasoning TEXT,                  -- AI explanation
  recommendation JSONB,            -- Recommended actions
  confidence FLOAT,                -- 0.0 to 1.0
  status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'executed', 'rejected'
  executed_at TIMESTAMP,
  executed_by UUID,
  result JSONB,                    -- Outcome if executed
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Next Steps

### For Full Production Deployment:

1. **Run the Migration** (see Setup step 2)

2. **Frontend Integration:**
   - Add AI control panel to dashboard
   - Display agent recommendations
   - Add approval workflow for actions
   - Show confidence scores and reasoning

3. **Testing:**
   - Test with real sensor data
   - Verify OpenAI responses
   - Test conflict resolution scenarios
   - Validate safety thresholds

4. **Human-in-the-Loop:**
   - Implement approval workflow
   - Add dry-run/simulation mode
   - Create audit trail viewer
   - Build notification system for critical issues

5. **Monitoring:**
   - Add logging for all AI decisions
   - Track agent performance metrics
   - Monitor OpenAI API usage/costs
   - Set up alerts for agent failures

## Current Limitations

1. **agent_decisions table not created yet** - Migration needs to be run manually
2. **No frontend UI yet** - Currently API-only
3. **No approval workflow** - All recommendations are "pending" status
4. **No realtime updates** - Need to poll endpoints or set up WebSocket
5. **OpenAI costs** - Each agent call uses GPT-4 (estimate $0.01-0.05 per request)

## Cost Considerations

- **Leak Detection:** ~1000 tokens per call (~$0.01-0.02)
- **Energy Optimization:** ~1500 tokens per call (~$0.02-0.03)
- **Safety Monitoring:** ~1200 tokens per call (~$0.015-0.025)
- **All Agents:** ~$0.05-0.10 per coordinated run

Recommend running:
- Safety: Every 5-15 minutes
- Leak Detection: Every 30 minutes
- Energy Optimization: Once per hour or on-demand

## Troubleshooting

**OpenAI API Error:**
```
Check OPENAI_API_KEY in .env file
Verify API key is active at https://platform.openai.com/api-keys
```

**Supabase Connection Error:**
```
Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
Check network connectivity
Ensure RLS policies allow service_role access
```

**No Sensor Data:**
```
Run import_data.py to populate sensor data
Verify sensors table has data in Supabase dashboard
```

**Agent Returns Empty Results:**
```
Check sensor data is present
Verify OpenAI API is responding
Review backend logs for errors
```

## Support

For issues or questions:
1. Check backend logs: `uvicorn main:app --reload`
2. Review Supabase logs in dashboard
3. Test OpenAI API key independently
4. Verify all environment variables are set

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│           Frontend (React + TS)             │
│  ┌────────────────────────────────────┐    │
│  │  Dashboard with AI Control Panel   │    │
│  └────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────┐
│      Backend (FastAPI + Python)             │
│  ┌────────────────────────────────────┐    │
│  │     Agent Coordinator              │    │
│  │  ┌──────┬─────────┬──────────┐   │    │
│  │  │ Leak │ Energy  │  Safety  │   │    │
│  │  │Agent │Optimizer│ Monitor  │   │    │
│  │  └──────┴─────────┴──────────┘   │    │
│  └────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
┌─────────┐  ┌──────────┐  ┌─────────┐
│Supabase │  │ OpenAI   │  │ Sensors │
│Database │  │  GPT-4   │  │  (IoT)  │
└─────────┘  └──────────┘  └─────────┘
```
