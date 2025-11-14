"""
Check all P7 incidents and clean up duplicates
"""
import asyncio
from ai_agents.supabase_client import supabase_client


async def main():
    print("🔍 Checking all incidents...")

    # Get all incidents
    incidents = await supabase_client.query("events", select="*")

    # Find P7 incidents
    p7_incidents = []
    for incident in incidents:
        asset_ref = incident.get("asset_ref")
        # P7 edge ID
        if asset_ref and asset_ref.startswith("014cced1"):
            p7_incidents.append(incident)

    print(f"\nFound {len(p7_incidents)} P7 incidents:")
    print("=" * 80)

    for incident in p7_incidents:
        print(f"\nIncident ID: {incident['id']}")
        print(f"  Title: {incident['title']}")
        print(f"  Asset Ref: {incident['asset_ref']}")
        print(f"  State: {incident['state']}")
        print(f"  Created: {incident['created_at']}")
        print(f"  Detected by: {incident.get('detected_by', 'N/A')}")

    if len(p7_incidents) > 1:
        # Sort by created_at, keep newest
        p7_incidents.sort(key=lambda x: x['created_at'], reverse=True)

        newest = p7_incidents[0]
        to_delete = p7_incidents[1:]

        print("\n" + "=" * 80)
        print(f"✅ KEEPING newest P7 incident:")
        print(f"   ID: {newest['id'][:8]}")
        print(f"   Created: {newest['created_at']}")

        print(f"\n🗑️  DELETING {len(to_delete)} old P7 incident(s):")
        for incident in to_delete:
            print(f"\n   ID: {incident['id'][:8]}")
            print(f"   Created: {incident['created_at']}")

            # Delete it
            await supabase_client.delete("events", id=f"eq.{incident['id']}")
            print(f"   ✅ Deleted")

        print("\n" + "=" * 80)
        print("✅ Cleanup complete!")
    else:
        print("\n✅ Only 1 P7 incident found - no cleanup needed")


if __name__ == "__main__":
    asyncio.run(main())
