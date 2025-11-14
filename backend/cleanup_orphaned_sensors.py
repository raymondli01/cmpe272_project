"""
Clean up sensors attached to non-existent edges
"""
import asyncio
from ai_agents.supabase_client import supabase_client


async def main():
    print("🔍 Finding orphaned sensors...\n")

    # Get all valid edge IDs
    edges = await supabase_client.query("edges", select="id,name")
    valid_edge_ids = {edge["id"] for edge in edges}

    print(f"Valid edges: {len(valid_edge_ids)}")
    for edge in edges:
        print(f"  {edge['name']}: {edge['id'][:8]}")

    # Get all sensors
    sensors = await supabase_client.query("sensors", select="*")

    orphaned = []
    for sensor in sensors:
        asset_id = sensor.get("asset_id")
        asset_type = sensor.get("asset_type")

        if asset_type == "edge" and asset_id not in valid_edge_ids:
            orphaned.append(sensor)

    print(f"\n📊 Found {len(orphaned)} orphaned sensors\n")

    if orphaned:
        print("=" * 80)
        for sensor in orphaned:
            print(f"\n❌ Orphaned sensor:")
            print(f"   ID: {sensor['id'][:8]}")
            print(f"   Type: {sensor['type']}")
            print(f"   Asset ID: {sensor['asset_id']}")
            print(f"   Value: {sensor['value']} {sensor['unit']}")

        print("\n" + "=" * 80)
        print(f"🗑️  Deleting {len(orphaned)} orphaned sensors...\n")

        for sensor in orphaned:
            await supabase_client.delete("sensors", id=f"eq.{sensor['id']}")
            print(f"   ✓ Deleted: {sensor['type']} sensor for {sensor['asset_id'][:8]}")

        print(f"\n✅ Cleanup complete!")
    else:
        print("✅ No orphaned sensors found")


if __name__ == "__main__":
    asyncio.run(main())
