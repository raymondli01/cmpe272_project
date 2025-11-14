"""
Check what network topology data we have in the database
"""
import asyncio
from ai_agents.supabase_client import supabase_client


async def main():
    # Check nodes
    nodes = await supabase_client.query("nodes", select="*")
    print(f"\n{'='*70}")
    print(f"NODES (Junctions): {len(nodes)}")
    print(f"{'='*70}")
    if nodes:
        for i, node in enumerate(nodes[:3], 1):
            print(f"{i}. ID: {node['id'][:8]}... | Name: {node.get('name', 'N/A')} | Lat/Lng: {node.get('latitude', 'N/A')}, {node.get('longitude', 'N/A')}")

    # Check edges
    edges = await supabase_client.query("edges", select="*")
    print(f"\n{'='*70}")
    print(f"EDGES (Pipes): {len(edges)}")
    print(f"{'='*70}")
    if edges:
        for i, edge in enumerate(edges[:5], 1):
            print(f"{i}. ID: {edge['id'][:8]}... | Name: {edge.get('name', 'N/A')}")
            print(f"   From: {edge.get('from_node', 'N/A')[:8] if edge.get('from_node') else 'N/A'}... → To: {edge.get('to_node', 'N/A')[:8] if edge.get('to_node') else 'N/A'}...")
            print(f"   Length: {edge.get('length_m', 'N/A')}m | Diameter: {edge.get('diameter_mm', 'N/A')}mm")

    # Check incidents linked to edges
    incidents = await supabase_client.query(
        "events",
        select="id,title,asset_ref,asset_type,state,severity",
        asset_type="eq.edge"
    )
    print(f"\n{'='*70}")
    print(f"INCIDENTS linked to edges: {len(incidents)}")
    print(f"{'='*70}")
    if incidents:
        for i, inc in enumerate(incidents[:5], 1):
            print(f"{i}. {inc['title']}")
            print(f"   Edge: {inc.get('asset_ref', 'N/A')[:8] if inc.get('asset_ref') else 'N/A'}... | State: {inc['state']} | Severity: {inc['severity']}")


if __name__ == "__main__":
    asyncio.run(main())
