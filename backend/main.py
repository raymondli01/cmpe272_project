import fastapi
import fastapi.middleware.cors
from ai_agents import AgentCoordinator, AnalyticsAgent
from ai_agents.supabase_client import supabase_client

app = fastapi.FastAPI(title="AWARE Water Management System API")

# Middleware Configuration
import os

# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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


# ========== NETWORK TOPOLOGY ENDPOINTS ==========

@app.get("/network/topology")
async def get_network_topology():
    """
    Get complete network topology with status based on SENSOR DATA for map visualization.
    Map colors are determined by sensor readings, not incidents.
    Incidents are included for reference but don't affect map colors.
    """
    try:
        # Fetch nodes and edges
        nodes = await supabase_client.query("nodes", select="*")
        edges = await supabase_client.query("edges", select="*")

        # Fetch all sensors
        sensors = await supabase_client.get_sensors_with_assets()

        # Group sensors by edge_id
        edge_sensors = {}
        for sensor in sensors:
            if sensor["asset_type"] == "edge":
                edge_id = sensor["asset_id"]
                if edge_id not in edge_sensors:
                    edge_sensors[edge_id] = []
                edge_sensors[edge_id].append(sensor)

        # Fetch all incidents linked to edges (for reference only)
        incidents = await supabase_client.query(
            "events",
            select="id,title,asset_ref,asset_type,state,severity,priority,confidence,detected_by,created_at",
            asset_type="eq.edge"
        )

        # Create incident map by edge_id
        incident_map = {}
        for incident in incidents:
            edge_id = incident.get("asset_ref")
            if edge_id:
                if edge_id not in incident_map:
                    incident_map[edge_id] = []
                incident_map[edge_id].append(incident)

        # Enhance edges with sensor-based status
        enhanced_edges = []
        leak_indicator_count = 0

        for edge in edges:
            edge_id = edge["id"]
            edge_incidents = incident_map.get(edge_id, [])
            sensors_list = edge_sensors.get(edge_id, [])

            # Analyze sensors to determine status
            pressure = None
            acoustic = None
            flow = None

            for sensor in sensors_list:
                if sensor["type"] == "pressure":
                    pressure = sensor["value"]
                elif sensor["type"] == "acoustic":
                    acoustic = sensor["value"]
                elif sensor["type"] == "flow":
                    flow = sensor["value"]

            # Determine leak indicators from sensor data
            leak_indicators = []
            if pressure is not None and pressure < 55:
                leak_indicators.append("LOW_PRESSURE")
            if acoustic is not None and acoustic > 5:
                leak_indicators.append("HIGH_ACOUSTIC")
            if flow is not None and flow > 110:
                leak_indicators.append("HIGH_FLOW")

            # Determine edge status based on sensor data
            if len(leak_indicators) >= 3:
                edge_status = "critical"  # All 3 indicators
            elif len(leak_indicators) >= 2:
                edge_status = "high"  # 2 indicators
            elif len(leak_indicators) >= 1:
                edge_status = "medium"  # 1 indicator
            else:
                edge_status = "normal"

            if len(leak_indicators) > 0:
                leak_indicator_count += 1

            # Filter incidents by state
            active_incidents = [inc for inc in edge_incidents if inc["state"] != "resolved"]
            open_incidents = [inc for inc in edge_incidents if inc["state"] == "open"]
            acknowledged_incidents = [inc for inc in edge_incidents if inc["state"] == "acknowledged"]
            resolved_incidents = [inc for inc in edge_incidents if inc["state"] == "resolved"]

            # Get highest priority incident (for reference)
            highest_priority_incident = None
            if active_incidents:
                highest_priority_incident = max(
                    active_incidents,
                    key=lambda x: x.get("priority", 0)
                )

            enhanced_edges.append({
                **edge,
                "status": edge_status,  # Based on SENSOR DATA
                "leak_indicators": leak_indicators,
                "sensor_data": {
                    "pressure": pressure,
                    "acoustic": acoustic,
                    "flow": flow
                },
                "active_incident_count": len(active_incidents),
                "total_incident_count": len(edge_incidents),
                "has_open_incidents": len(open_incidents) > 0,
                "has_acknowledged_incidents": len(acknowledged_incidents) > 0,
                "highest_priority_incident": highest_priority_incident,
                "all_incidents": edge_incidents
            })

        return {
            "nodes": nodes,
            "edges": enhanced_edges,
            "incident_summary": {
                "total_edges": len(edges),
                "edges_with_leak_indicators": leak_indicator_count,
                "edges_with_active_incidents": len([e for e in enhanced_edges if e["active_incident_count"] > 0]),
                "total_active_incidents": sum(e["active_incident_count"] for e in enhanced_edges),
                "critical_edges": len([e for e in enhanced_edges if e["status"] == "critical"]),
                "high_severity_edges": len([e for e in enhanced_edges if e["status"] == "high"]),
            }
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "nodes": [], "edges": []}
