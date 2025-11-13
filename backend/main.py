import fastapi
import fastapi.middleware.cors
from ai_agents import AgentCoordinator, AnalyticsAgent
from ai_agents.supabase_client import supabase_client

app = fastapi.FastAPI(title="AWARE Water Management System API")

# Middleware Configuration
app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent coordinator and analytics agent
coordinator = AgentCoordinator()
analytics_agent = AnalyticsAgent()


# Root Endpoint
@app.get("/")
def read_root():
    return {"status": "ok", "message": "AWARE Water Management System API"}


# Sensor Data from Supabase
@app.get("/sensors")
async def get_sensors():
    """
    Get real sensor data from Supabase database.
    Returns all sensors with their current readings.
    """
    try:
        sensors = await supabase_client.get_sensors_with_assets()
        return {"sensors": sensors, "count": len(sensors)}
    except Exception as e:
        return {"error": str(e), "sensors": []}


# Legacy Leak Detection (simple rule-based)
@app.get("/leaks")
async def get_leaks():
    """
    Legacy simple leak detection based on basic rules.
    For AI-powered leak detection, use /ai/leak-detection endpoint.
    """
    try:
        sensors = await supabase_client.get_sensors_with_assets()

        # Group sensors by edge
        edges_data = {}
        for sensor in sensors:
            if sensor["asset_type"] == "edge":
                edge_id = sensor["asset_id"]
                if edge_id not in edges_data:
                    edges_data[edge_id] = {"edge_id": edge_id, "sensors": {}}
                edges_data[edge_id]["sensors"][sensor["type"]] = sensor["value"]

        # Simple rule: pressure < 60 and acoustic > 0.7
        leaks = []
        for edge_id, data in edges_data.items():
            sensors_dict = data["sensors"]
            pressure = sensors_dict.get("pressure", 100)
            acoustic = sensors_dict.get("acoustic", 0)
            if pressure < 60 and acoustic > 2.5:  # acoustic in dB
                leaks.append({
                    "edge_id": edge_id,
                    "pressure": pressure,
                    "acoustic": acoustic,
                    "leak": True,
                })

        return {"leaks": leaks, "count": len(leaks)}
    except Exception as e:
        return {"error": str(e), "leaks": []}


# ========== AI AGENT ENDPOINTS ==========

@app.post("/ai/analyze")
async def run_all_agents():
    """
    Run all AI agents (Leak Preemption, Energy Optimizer, Safety Monitor)
    and return coordinated recommendations.
    """
    try:
        result = await coordinator.run_all_agents()
        return result
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/ai/leak-detection")
async def run_leak_detection():
    """
    Run AI-powered leak detection agent.
    Uses sensor fusion (acoustic + pressure + flow) with OpenAI analysis.
    """
    try:
        result = await coordinator.run_leak_detection()
        return result
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/ai/energy-optimization")
async def run_energy_optimization():
    """
    Run energy optimization agent.
    Creates optimal pump/tank schedules based on energy prices.
    """
    try:
        result = await coordinator.run_energy_optimization()
        return result
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/ai/safety-monitoring")
async def run_safety_monitoring():
    """
    Run safety monitoring agent.
    Checks for pressure violations and system safety issues.
    """
    try:
        result = await coordinator.run_safety_monitoring()
        return result
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/ai/generate-analytics")
async def generate_analytics():
    """
    Generate all AI analytics: NRW, uptime, demand forecast, and energy metrics.
    This populates the dashboard with fresh AI-generated data.
    """
    try:
        result = await analytics_agent.generate_all_analytics()
        return result
    except Exception as e:
        return {"status": "error", "error": str(e)}
