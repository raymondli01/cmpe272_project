"""
Verify AI-created incidents in database
"""
import asyncio
from ai_agents.supabase_client import supabase_client


async def main():
    # Query incidents from events table
    incidents = await supabase_client.query(
        "events",
        select="*",
        detected_by="eq.Leak Preemption Agent"
    )

    print(f"\n{'='*70}")
    print(f"AI-DETECTED INCIDENTS IN DATABASE")
    print(f"{'='*70}\n")

    if not incidents:
        print("❌ No AI-detected incidents found in database")
        return

    print(f"✅ Found {len(incidents)} AI-detected incident(s)\n")

    for i, incident in enumerate(incidents, 1):
        print(f"--- Incident #{i} ---")
        print(f"  ID: {incident['id']}")
        print(f"  Title: {incident['title']}")
        print(f"  Severity: {incident['severity']}")
        print(f"  Priority: {incident.get('priority', 'N/A')}")
        print(f"  Confidence: {incident.get('confidence', 'N/A')}")
        print(f"  Detected by: {incident.get('detected_by', 'N/A')}")
        print(f"  State: {incident['state']}")
        print(f"  Created: {incident.get('created_at', 'N/A')[:19]}")

        # Check metadata
        metadata = incident.get('metadata', {})
        if metadata:
            print(f"\n  Metadata:")
            if 'sensor_indicators' in metadata:
                print(f"    Sensors: {list(metadata['sensor_indicators'].keys())}")
            if 'urgency' in metadata:
                print(f"    Urgency: {metadata['urgency']}")
            if 'recommendation' in metadata:
                rec = metadata['recommendation']
                if 'action' in rec:
                    print(f"    Action: {rec['action']}")
                if 'dispatch_crew' in rec:
                    print(f"    Dispatch Crew: {rec['dispatch_crew']}")
        print()

    print(f"{'='*70}")
    print("Next step: Open http://localhost:5173/incidents to view in UI")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    asyncio.run(main())
