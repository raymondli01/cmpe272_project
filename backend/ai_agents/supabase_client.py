"""
Supabase client helper for AI agents
"""
import os
from pathlib import Path
import httpx
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

# Load .env from project root (two levels up from this file)
ROOT_DIR = Path(__file__).parent.parent.parent
load_dotenv(dotenv_path=ROOT_DIR / '.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase credentials in environment variables")


class SupabaseClient:
    """Simple Supabase REST API client"""

    def __init__(self):
        self.url = SUPABASE_URL.rstrip("/")
        self.headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def query(self, table: str, select: str = "*", **filters) -> List[Dict[str, Any]]:
        """
        Query a Supabase table

        Args:
            table: Table name
            select: Columns to select (default: "*")
            **filters: Query filters (e.g., status="eq.active")
        """
        url = f"{self.url}/rest/v1/{table}"
        params = {"select": select, **filters}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()

    async def insert(
        self, table: str, data: Dict[str, Any] | List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Insert data into a Supabase table

        Args:
            table: Table name
            data: Data to insert (single dict or list of dicts)
        """
        url = f"{self.url}/rest/v1/{table}"

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()

    async def update(
        self, table: str, data: Dict[str, Any], **filters
    ) -> List[Dict[str, Any]]:
        """
        Update data in a Supabase table

        Args:
            table: Table name
            data: Data to update
            **filters: Query filters
        """
        url = f"{self.url}/rest/v1/{table}"

        async with httpx.AsyncClient() as client:
            response = await client.patch(
                url, headers=self.headers, json=data, params=filters
            )
            response.raise_for_status()
            return response.json()

    async def get_sensors_with_assets(self) -> List[Dict[str, Any]]:
        """Get all sensors with their associated asset information"""
        sensors = await self.query(
            "sensors",
            select="id,asset_id,asset_type,type,value,unit,last_seen,created_at",
        )
        return sensors

    async def get_energy_prices(self, limit: int = 24) -> List[Dict[str, Any]]:
        """Get energy prices (for the next 24 hours by default)"""
        try:
            # Simple query without ordering to avoid Supabase issues
            prices = await self.query("energy_prices", select="*")
            # Sort in Python instead by timestamp column
            if prices:
                prices = sorted(prices, key=lambda x: x.get('timestamp', ''))[:limit]
            return prices
        except Exception as e:
            print(f"Error fetching energy prices: {e}")
            # Return empty list if table doesn't exist or is empty
            return []

    async def get_valves_pumps(self) -> List[Dict[str, Any]]:
        """Get all valves and pumps"""
        return await self.query("valves_pumps", select="*")

    async def get_agent_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get agent by name"""
        agents = await self.query("agents", select="*", name=f"eq.{name}")
        return agents[0] if agents else None


# Singleton instance
supabase_client = SupabaseClient()
