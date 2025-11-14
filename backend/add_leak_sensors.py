"""
Add sensors with leak indicators to specific pipes for demo
This creates realistic sensor data that will trigger AI leak detection
"""
import asyncio
from ai_agents.supabase_client import supabase_client


async def add_sensors():
    """Add sensors with leak indicators to 3 pipes"""

    # PIPE 1: Critical leak (P5) - High confidence detection expected
    pipe1_id = "e007eecf-0130-4b28-8d25-9286f7355c96"

    sensors_pipe1 = [
        {
            "asset_id": pipe1_id,
            "asset_type": "edge",
            "type": "pressure",
            "value": 48.0,  # LOW - dropped from normal 65 psi
            "unit": "psi",
            "last_seen": "now()"
        },
        {
            "asset_id": pipe1_id,
            "asset_type": "edge",
            "type": "acoustic",
            "value": 8.5,  # HIGH - spike from normal 2-3 dB
            "unit": "dB",
            "last_seen": "now()"
        },
        {
            "asset_id": pipe1_id,
            "asset_type": "edge",
            "type": "flow",
            "value": 125.0,  # HIGH - increased from normal 80-100 L/s
            "unit": "L/s",
            "last_seen": "now()"
        }
    ]

    # PIPE 2: Moderate leak (P7) - Medium confidence detection expected
    pipe2_id = "014cced1-4a30-445a-8a4f-e61ca2be2fdd"

    sensors_pipe2 = [
        {
            "asset_id": pipe2_id,
            "asset_type": "edge",
            "type": "pressure",
            "value": 55.0,  # Slightly LOW
            "unit": "psi",
            "last_seen": "now()"
        },
        {
            "asset_id": pipe2_id,
            "asset_type": "edge",
            "type": "acoustic",
            "value": 6.2,  # Moderately HIGH
            "unit": "dB",
            "last_seen": "now()"
        },
        {
            "asset_id": pipe2_id,
            "asset_type": "edge",
            "type": "flow",
            "value": 110.0,  # Moderately HIGH
            "unit": "L/s",
            "last_seen": "now()"
        }
    ]

    # PIPE 3: Minor leak (P10) - Lower confidence detection expected
    pipe3_id = "f1912789-b0e9-4d63-86b9-c57c90f5bf07"

    sensors_pipe3 = [
        {
            "asset_id": pipe3_id,
            "asset_type": "edge",
            "type": "pressure",
            "value": 58.0,  # Slightly LOW
            "unit": "psi",
            "last_seen": "now()"
        },
        {
            "asset_id": pipe3_id,
            "asset_type": "edge",
            "type": "acoustic",
            "value": 4.8,  # Slightly elevated
            "unit": "dB",
            "last_seen": "now()"
        },
        {
            "asset_id": pipe3_id,
            "asset_type": "edge",
            "type": "flow",
            "value": 95.0,  # Near normal
            "unit": "L/s",
            "last_seen": "now()"
        }
    ]

    all_sensors = sensors_pipe1 + sensors_pipe2 + sensors_pipe3

    print(f"🔧 Adding {len(all_sensors)} sensors with leak indicators...")
    print(f"   - Pipe P5 ({pipe1_id[:8]}...): Critical leak indicators")
    print(f"   - Pipe P7 ({pipe2_id[:8]}...): Moderate leak indicators")
    print(f"   - Pipe P10 ({pipe3_id[:8]}...): Minor leak indicators")

    # Prepare sensors for bulk insert (remove 'last_seen' field as it will be auto-set)
    sensors_to_insert = []
    for sensor in all_sensors:
        sensor_data = {
            "asset_id": sensor["asset_id"],
            "asset_type": sensor["asset_type"],
            "type": sensor["type"],
            "value": sensor["value"],
            "unit": sensor["unit"]
        }
        sensors_to_insert.append(sensor_data)

    # Insert all sensors in one batch
    try:
        result = await supabase_client.insert("sensors", sensors_to_insert)
        for sensor in result:
            print(f"   ✓ Added {sensor['type']} sensor: {sensor['value']} {sensor['unit']}")
    except Exception as e:
        print(f"   ✗ Error adding sensors: {e}")

    print(f"\n✅ Sensor data added successfully!")
    print(f"\nNext step: Click 'Run Analysis' on Leak Preemption Agent")
    print(f"The AI should detect 2-3 leaks and auto-create incidents!")


if __name__ == "__main__":
    asyncio.run(add_sensors())
