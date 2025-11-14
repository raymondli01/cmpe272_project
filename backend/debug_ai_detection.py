"""
Debug what the AI agent is seeing
"""
import asyncio
from ai_agents.leak_preemption_agent import LeakPreemptionAgent


async def main():
    agent = LeakPreemptionAgent()

    # Manually call the fetch sensor data method
    print("=" * 80)
    print("🔍 Fetching sensor data that AI will analyze...")
    print("=" * 80)

    edge_data = await agent._fetch_sensor_data()

    print(f"\nTotal pipes with sensors: {len(edge_data)}")
    print(f"Total sensors: {sum(len(sensors) for sensors in edge_data.values())}")

    for edge_id, sensors in edge_data.items():
        print(f"\n{'=' * 80}")
        print(f"Edge ID: {edge_id[:8]}")
        print(f"Sensors: {len(sensors)}")
        for sensor in sensors:
            print(f"  - {sensor['type']}: {sensor['value']} {sensor['unit']}")
            print(f"    Last seen: {sensor.get('last_seen', 'N/A')}")

    # Now prepare the prompt to see what's being sent to OpenAI
    print("\n" + "=" * 80)
    print("📝 Prompt that will be sent to OpenAI:")
    print("=" * 80)
    prompt = agent._prepare_prompt(edge_data)
    print(prompt)


if __name__ == "__main__":
    asyncio.run(main())
