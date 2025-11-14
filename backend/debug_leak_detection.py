"""
Debug script to see what data the AI agent is analyzing
"""
import asyncio
from ai_agents.leak_preemption_agent import LeakPreemptionAgent


async def main():
    agent = LeakPreemptionAgent()

    # Fetch sensor data (same as agent does)
    edge_data = await agent._fetch_sensor_data()

    print("=" * 60)
    print("SENSOR DATA BY PIPE (What AI sees):")
    print("=" * 60)

    for edge_id, sensors in edge_data.items():
        print(f"\n📍 Pipe {edge_id[:8]}... ({len(sensors)} sensors)")
        print("-" * 40)
        for sensor in sensors:
            print(f"  {sensor['type']:10} = {sensor['value']:7} {sensor['unit']:5} (created: {sensor['created_at'][:10]})")

    print("\n" + "=" * 60)
    print("PREPARING PROMPT FOR AI...")
    print("=" * 60)

    prompt = agent._prepare_prompt(edge_data)
    print(prompt)

    print("\n" + "=" * 60)
    print("RUNNING AI ANALYSIS...")
    print("=" * 60)

    result = await agent.analyze()
    print(f"\nStatus: {result['status']}")
    print(f"Leaks detected: {len(result.get('leaks_detected', []))}")
    print(f"Actionable leaks: {len(result.get('actionable_leaks', []))}")
    print(f"Incidents created: {result.get('incidents_created', 0)}")

    if result.get('leaks_detected'):
        print("\nDetected leaks:")
        for leak in result['leaks_detected']:
            print(f"  - {leak['edge_id'][:8]}...: confidence={leak['confidence']:.2f}, urgency={leak['urgency']}")


if __name__ == "__main__":
    asyncio.run(main())
