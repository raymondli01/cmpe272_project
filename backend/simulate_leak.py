"""
Simulate a leak by updating sensor data to show anomalous readings
This makes the Leak Preemption Agent detect the leak when it runs
"""
import asyncio
import random
from ai_agents.supabase_client import supabase_client


async def simulate_leak_on_edge(edge_id: str):
    """
    Simulate a leak by updating sensors on a specific edge (pipe)

    Args:
        edge_id: UUID of the edge/pipe to simulate leak on
    """
    print(f"\n🚨 Simulating leak on edge {edge_id}...")

    # Get current sensors for this edge
    sensors = await supabase_client.query(
        "sensors",
        select="*",
        asset_type="eq.edge",
        asset_id=f"eq.{edge_id}"
    )

    if not sensors:
        print(f"❌ No sensors found for edge {edge_id}")
        return

    print(f"Found {len(sensors)} sensors on this edge")

    # Update each sensor type to show leak indicators
    for sensor in sensors:
        sensor_id = sensor["id"]
        sensor_type = sensor["type"]

        # Simulate leak-like anomalies
        if sensor_type == "pressure":
            # Pressure DROP (normal ~65 psi → drop to 45 psi)
            new_value = random.uniform(40, 50)
            print(f"  📉 Pressure: {sensor['value']} → {new_value:.1f} psi (DROPPED)")

        elif sensor_type == "acoustic":
            # Acoustic SPIKE (normal ~2-3 dB → spike to 8+ dB)
            new_value = random.uniform(7.5, 9.5)
            print(f"  📈 Acoustic: {sensor['value']} → {new_value:.1f} dB (SPIKE)")

        elif sensor_type == "flow":
            # Flow INCREASE (normal ~80-100 L/s → increase to 120+ L/s)
            new_value = random.uniform(115, 130)
            print(f"  📈 Flow: {sensor['value']} → {new_value:.1f} L/s (INCREASED)")

        else:
            continue

        # Update sensor value in database
        await supabase_client.client.table("sensors").update({
            "value": new_value,
            "last_seen": "now()"
        }).eq("id", sensor_id).execute()

    print(f"\n✅ Leak simulation complete!")
    print(f"Now run: curl -X POST http://localhost:8000/ai/leak-detection")
    print(f"The AI should detect this leak and create an incident!")


async def get_random_edge():
    """Get a random edge ID from the database"""
    edges = await supabase_client.query("edges", select="id,name", limit=10)

    if not edges:
        print("❌ No edges found in database")
        return None

    print("\n🔍 Available edges:")
    for i, edge in enumerate(edges):
        print(f"  {i+1}. {edge['name']} (ID: {edge['id'][:8]}...)")

    # Pick first edge
    selected = edges[0]
    print(f"\n✓ Selected: {selected['name']}")
    return selected["id"]


async def reset_sensors_to_normal(edge_id: str):
    """Reset sensors back to normal values"""
    print(f"\n🔄 Resetting sensors on edge {edge_id} to normal...")

    sensors = await supabase_client.query(
        "sensors",
        select="*",
        asset_type="eq.edge",
        asset_id=f"eq.{edge_id}"
    )

    for sensor in sensors:
        sensor_id = sensor["id"]
        sensor_type = sensor["type"]

        # Normal values
        if sensor_type == "pressure":
            new_value = random.uniform(60, 70)
        elif sensor_type == "acoustic":
            new_value = random.uniform(2.0, 3.5)
        elif sensor_type == "flow":
            new_value = random.uniform(80, 100)
        else:
            continue

        await supabase_client.client.table("sensors").update({
            "value": new_value,
            "last_seen": "now()"
        }).eq("id", sensor_id).execute()

    print("✅ Sensors reset to normal values")


async def main():
    """Main function"""
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "reset":
            # Reset sensors to normal
            edge_id = await get_random_edge()
            if edge_id:
                await reset_sensors_to_normal(edge_id)
        else:
            # Use provided edge ID
            await simulate_leak_on_edge(command)
    else:
        # Auto-select a random edge
        edge_id = await get_random_edge()
        if edge_id:
            await simulate_leak_on_edge(edge_id)


if __name__ == "__main__":
    asyncio.run(main())
