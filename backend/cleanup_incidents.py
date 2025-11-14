"""
Clean up incidents with UUID in titles and check database state
"""
import asyncio
from ai_agents.supabase_client import supabase_client


async def main():
    print("🔍 Checking current incidents...")

    # Get all incidents
    incidents = await supabase_client.query("events", select="*")

    print(f"\n📊 Found {len(incidents)} total incidents")

    # Find incidents with UUID in title
    uuid_incidents = []
    for incident in incidents:
        title = incident.get("title", "")
        # Check if title contains UUID patterns (8 characters hex)
        if any(x in title for x in ["014cced1", "e007eecf", "f1912789"]):
            uuid_incidents.append(incident)
            print(f"\n❌ Found UUID incident:")
            print(f"   ID: {incident['id'][:8]}")
            print(f"   Title: {title}")
            print(f"   Asset Ref: {incident.get('asset_ref', 'N/A')[:8] if incident.get('asset_ref') else 'N/A'}")
            print(f"   State: {incident.get('state')}")
            print(f"   Created: {incident.get('created_at')}")

    if uuid_incidents:
        print(f"\n🗑️  Deleting {len(uuid_incidents)} incidents with UUIDs in title...")
        for incident in uuid_incidents:
            await supabase_client.delete("events", id=f"eq.{incident['id']}")
            print(f"   ✓ Deleted: {incident['title']}")
        print("\n✅ Cleanup complete!")
    else:
        print("\n✅ No UUID incidents found")

    # Show current edges and their names
    print("\n📍 Pipe Information:")
    edges = await supabase_client.query("edges", select="id,name")
    for edge in edges:
        print(f"   {edge['name']}: {edge['id']}")

    # Show remaining incidents
    print("\n📋 Current incidents after cleanup:")
    incidents = await supabase_client.query("events", select="*")
    if incidents:
        for incident in incidents:
            print(f"\n   Title: {incident['title']}")
            print(f"   State: {incident['state']}")
            print(f"   Asset Ref: {incident.get('asset_ref', 'N/A')[:8] if incident.get('asset_ref') else 'N/A'}")
    else:
        print("   No incidents in database")


if __name__ == "__main__":
    asyncio.run(main())
