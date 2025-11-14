"""
Check which pipes have leak indicators in their sensors
"""
import asyncio
from ai_agents.supabase_client import supabase_client


async def main():
    print("🔍 Checking sensors for leak indicators...\n")

    # Get all sensors on edges
    sensors = await supabase_client.get_sensors_with_assets()

    # Group by edge
    edges_sensors = {}
    for sensor in sensors:
        if sensor["asset_type"] == "edge":
            edge_id = sensor["asset_id"]
            if edge_id not in edges_sensors:
                edges_sensors[edge_id] = []
            edges_sensors[edge_id].append(sensor)

    # Get edge names
    edges = await supabase_client.query("edges", select="id,name")
    edge_name_map = {edge["id"]: edge["name"] for edge in edges}

    print("=" * 80)
    for edge_id, sensors_list in edges_sensors.items():
        edge_name = edge_name_map.get(edge_id, edge_id[:8])

        # Check for leak indicators
        has_leak_indicators = False
        pressure = None
        acoustic = None
        flow = None

        for sensor in sensors_list:
            if sensor["type"] == "pressure":
                pressure = sensor["value"]
                if pressure < 55:  # Leak indicator
                    has_leak_indicators = True
            elif sensor["type"] == "acoustic":
                acoustic = sensor["value"]
                if acoustic > 5:  # Leak indicator
                    has_leak_indicators = True
            elif sensor["type"] == "flow":
                flow = sensor["value"]
                if flow > 110:  # Leak indicator
                    has_leak_indicators = True

        status = "🔴 LEAK INDICATORS" if has_leak_indicators else "✅ Normal"

        print(f"\n{status} - Pipe {edge_name}")
        print(f"  Pressure: {pressure} psi" + (" ⚠️ LOW" if pressure and pressure < 55 else ""))
        print(f"  Acoustic: {acoustic} dB" + (" ⚠️ HIGH" if acoustic and acoustic > 5 else ""))
        print(f"  Flow: {flow} L/s" + (" ⚠️ HIGH" if flow and flow > 110 else ""))

    print("\n" + "=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
