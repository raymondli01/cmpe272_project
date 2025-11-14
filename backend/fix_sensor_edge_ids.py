"""
Fix sensor asset_id references to use full edge IDs instead of partial UUIDs
"""
import asyncio
from ai_agents.supabase_client import supabase_client


async def main():
    print("🔍 Checking sensor asset_id references...\n")

    # Get all edges
    edges = await supabase_client.query("edges", select="id,name")
    edge_map = {edge["id"]: edge["name"] for edge in edges}

    # Create a map of partial IDs to full IDs
    partial_to_full = {}
    for edge_id, edge_name in edge_map.items():
        partial = edge_id[:8]
        partial_to_full[partial] = edge_id
        print(f"  {edge_name}: {partial} → {edge_id}")

    print("\n" + "=" * 80)

    # Get all sensors
    sensors = await supabase_client.query("sensors", select="*")

    fixed_count = 0
    for sensor in sensors:
        asset_id = sensor.get("asset_id")
        asset_type = sensor.get("asset_type")

        if asset_type == "edge" and asset_id:
            # Check if this is a partial ID (8 chars) or a UUID pattern that's not in our edge map
            if len(asset_id) == 8 or (asset_id not in edge_map and asset_id[:8] in partial_to_full):
                partial = asset_id[:8]
                full_id = partial_to_full.get(partial)

                if full_id:
                    print(f"\n🔧 Fixing sensor {sensor['id'][:8]}:")
                    print(f"   Type: {sensor['type']}")
                    print(f"   Old asset_id: {asset_id}")
                    print(f"   New asset_id: {full_id}")

                    # Update the sensor
                    await supabase_client.update(
                        "sensors",
                        {"asset_id": full_id},
                        id=f"eq.{sensor['id']}"
                    )
                    fixed_count += 1

    print("\n" + "=" * 80)
    print(f"✅ Fixed {fixed_count} sensors")


if __name__ == "__main__":
    asyncio.run(main())
