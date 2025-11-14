"""
Comprehensive database audit to find all issues
"""
import asyncio
from ai_agents.supabase_client import supabase_client


async def main():
    print("=" * 80)
    print("🔍 COMPREHENSIVE DATABASE AUDIT")
    print("=" * 80)

    # 1. Check Edges (Pipes)
    print("\n📍 EDGES (Pipes)")
    print("-" * 80)
    edges = await supabase_client.query("edges", select="*")
    edge_map = {edge["id"]: edge["name"] for edge in edges}

    for edge in edges:
        print(f"  {edge['name']} ({edge['id']})")
        print(f"    Status: {edge.get('status', 'N/A')}")
        print(f"    From: {edge.get('from_node_id', 'N/A')[:8]}")
        print(f"    To: {edge.get('to_node_id', 'N/A')[:8]}")

    # 2. Check Sensors
    print("\n🔬 SENSORS")
    print("-" * 80)
    sensors = await supabase_client.query("sensors", select="*")

    # Group by asset_id
    sensors_by_asset = {}
    for sensor in sensors:
        asset_id = sensor.get("asset_id")
        if asset_id not in sensors_by_asset:
            sensors_by_asset[asset_id] = []
        sensors_by_asset[asset_id].append(sensor)

    print(f"Total sensors: {len(sensors)}")
    print(f"Assets with sensors: {len(sensors_by_asset)}")

    # Check each asset
    for asset_id, asset_sensors in sensors_by_asset.items():
        asset_name = edge_map.get(asset_id, f"UNKNOWN-{asset_id[:8]}")
        print(f"\n  {asset_name} ({asset_id[:8]}):")

        # Check if asset exists
        if asset_id not in edge_map:
            print(f"    ⚠️  WARNING: Asset ID not found in edges table!")

        for sensor in asset_sensors:
            print(f"    - {sensor['type']}: {sensor['value']} {sensor['unit']} (ID: {sensor['id'][:8]})")
            print(f"      Last seen: {sensor.get('last_seen', 'N/A')}")
            print(f"      Asset type: {sensor.get('asset_type', 'N/A')}")

            # Check for data issues
            if sensor.get('asset_type') != 'edge':
                print(f"      ⚠️  WARNING: asset_type is '{sensor.get('asset_type')}', not 'edge'")

    # 3. Check for leak indicators
    print("\n🚨 LEAK INDICATOR ANALYSIS")
    print("-" * 80)

    for asset_id, asset_sensors in sensors_by_asset.items():
        asset_name = edge_map.get(asset_id, f"UNKNOWN-{asset_id[:8]}")

        pressure = None
        acoustic = None
        flow = None

        for sensor in asset_sensors:
            if sensor['type'] == 'pressure':
                pressure = sensor['value']
            elif sensor['type'] == 'acoustic':
                acoustic = sensor['value']
            elif sensor['type'] == 'flow':
                flow = sensor['value']

        # Check for leak indicators
        has_leak = False
        reasons = []

        if pressure is not None and pressure < 55:
            has_leak = True
            reasons.append(f"LOW PRESSURE ({pressure} < 55 psi)")

        if acoustic is not None and acoustic > 5:
            has_leak = True
            reasons.append(f"HIGH ACOUSTIC ({acoustic} > 5 dB)")

        if flow is not None and flow > 110:
            has_leak = True
            reasons.append(f"HIGH FLOW ({flow} > 110 L/s)")

        if has_leak:
            print(f"\n  🔴 {asset_name}:")
            print(f"    Pressure: {pressure} psi")
            print(f"    Acoustic: {acoustic} dB")
            print(f"    Flow: {flow} L/s")
            print(f"    Indicators: {', '.join(reasons)}")

    # 4. Check Events/Incidents
    print("\n📋 EVENTS (Incidents)")
    print("-" * 80)
    events = await supabase_client.query("events", select="*")

    print(f"Total events: {len(events)}")

    for event in events:
        print(f"\n  Event {event['id'][:8]}:")
        print(f"    Title: {event['title']}")
        print(f"    State: {event['state']}")
        print(f"    Severity: {event['severity']}")
        print(f"    Kind: {event.get('kind', 'N/A')}")
        print(f"    Asset Ref: {event.get('asset_ref', 'N/A')[:8] if event.get('asset_ref') else 'N/A'}")
        print(f"    Asset Type: {event.get('asset_type', 'N/A')}")
        print(f"    Detected by: {event.get('detected_by', 'Manual')}")
        print(f"    Created: {event.get('created_at', 'N/A')}")

        # Check if asset_ref is valid
        if event.get('asset_ref') and event.get('asset_ref') not in edge_map:
            print(f"    ⚠️  WARNING: asset_ref '{event['asset_ref'][:8]}' not found in edges!")

    # 5. Summary
    print("\n" + "=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)

    # Count leak indicators
    leak_count = 0
    for asset_id, asset_sensors in sensors_by_asset.items():
        asset_name = edge_map.get(asset_id, "UNKNOWN")

        pressure = None
        acoustic = None
        flow = None

        for sensor in asset_sensors:
            if sensor['type'] == 'pressure':
                pressure = sensor['value']
            elif sensor['type'] == 'acoustic':
                acoustic = sensor['value']
            elif sensor['type'] == 'flow':
                flow = sensor['value']

        has_leak = False
        if pressure is not None and pressure < 55:
            has_leak = True
        if acoustic is not None and acoustic > 5:
            has_leak = True
        if flow is not None and flow > 110:
            has_leak = True

        if has_leak:
            leak_count += 1

    print(f"  Total Edges: {len(edges)}")
    print(f"  Total Sensors: {len(sensors)}")
    print(f"  Edges with Sensors: {len(sensors_by_asset)}")
    print(f"  Edges with Leak Indicators: {leak_count}")
    print(f"  Total Events: {len(events)}")
    print(f"  Active Events: {len([e for e in events if e['state'] != 'resolved'])}")

    print("\n" + "=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
