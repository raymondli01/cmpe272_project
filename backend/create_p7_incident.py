"""
Manually create incident for P7 to test the map
"""
import asyncio
from ai_agents.supabase_client import supabase_client
from datetime import datetime


async def main():
    print("🔧 Creating incident for P7...")

    # P7 edge ID
    p7_edge_id = "014cced1-e62f-4178-8539-a644fb6543ba"

    incident_data = {
        "kind": "leak",
        "severity": "critical",
        "asset_ref": p7_edge_id,
        "asset_type": "edge",
        "state": "open",
        "title": "AI Detected: Potential leak at Pipe P7",
        "description": "Confidence: 92%\n\nThis pipe shows a high likelihood of a leak due to a combination of low pressure (52 psi), high acoustic readings (6.2 dB), and high flow (115 L/s).",
        "detected_by": "Leak Preemption Agent",
        "confidence": 0.92,
        "priority": 92,
        "metadata": {
            "sensor_indicators": {
                "acoustic": "HIGH - 6.2 dB (above 5 dB threshold)",
                "pressure": "LOW - 52 psi (below 55 psi threshold)",
                "flow": "HIGH - 115 L/s (above 110 L/s threshold)"
            },
            "reasoning": "This pipe shows a high likelihood of a leak due to a combination of low pressure (52 psi), high acoustic readings (6.2 dB), and high flow (115 L/s).",
            "recommendation": {
                "action": "isolate",
                "valves_to_close": ["V3", "V4"],
                "dispatch_crew": True
            },
            "urgency": "immediate",
            "detection_timestamp": datetime.utcnow().isoformat(),
            "edge_name": "P7"
        }
    }

    # Create incident
    result = await supabase_client.insert("events", incident_data)

    print(f"✅ Created incident for P7: {result[0]['id'][:8]}")
    print(f"   Title: {result[0]['title']}")
    print(f"   State: {result[0]['state']}")
    print(f"   Severity: {result[0]['severity']}")


if __name__ == "__main__":
    asyncio.run(main())
