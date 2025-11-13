"""
Energy Optimizer Agent

Optimizes pump and tank scheduling against day-ahead energy prices
while maintaining pressure requirements and system safety.
"""
import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from openai import AsyncOpenAI
from dotenv import load_dotenv
from .supabase_client import supabase_client

load_dotenv()


class EnergyOptimizerAgent:
    """
    AI Agent for energy cost optimization

    Analyzes energy prices and creates optimal pump/tank schedules
    while respecting pressure floor constraints and system requirements.
    """

    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.agent_name = "Energy Optimizer Agent"
        self.agent_id = None
        self.min_pressure_psi = 40  # Minimum pressure guardrail

    async def _get_agent_id(self) -> str:
        """Get agent ID from database"""
        if not self.agent_id:
            agent = await supabase_client.get_agent_by_name(self.agent_name)
            if agent:
                self.agent_id = agent["id"]
        return self.agent_id

    async def _fetch_optimization_data(self) -> Dict[str, Any]:
        """
        Fetch energy prices, pumps, sensors, and current system state

        Returns:
            Dictionary with all data needed for optimization
        """
        # Get energy prices (next 24 hours)
        energy_prices = await supabase_client.get_energy_prices(limit=24)

        # Get all pumps and valves
        valves_pumps = await supabase_client.get_valves_pumps()
        pumps = [vp for vp in valves_pumps if vp["kind"] == "pump"]

        # Get current sensor readings (pressure monitoring)
        sensors = await supabase_client.get_sensors_with_assets()
        pressure_sensors = [s for s in sensors if s["type"] == "pressure"]

        # Calculate current average pressure
        avg_pressure = (
            sum(s["value"] for s in pressure_sensors) / len(pressure_sensors)
            if pressure_sensors
            else 60.0
        )

        return {
            "energy_prices": energy_prices,
            "pumps": pumps,
            "pressure_sensors": pressure_sensors,
            "current_avg_pressure": avg_pressure,
            "min_pressure_constraint": self.min_pressure_psi,
        }

    def _prepare_prompt(self, data: Dict[str, Any]) -> str:
        """
        Prepare optimization prompt for OpenAI

        Args:
            data: System data from _fetch_optimization_data()

        Returns:
            Formatted prompt string
        """
        prompt = """You are an energy optimization AI agent for water distribution systems.

Your task is to create an optimal 24-hour pump schedule that minimizes energy costs while maintaining system pressure requirements.

Current System State:
"""
        prompt += f"  - Current Average Pressure: {data['current_avg_pressure']:.1f} psi\n"
        prompt += f"  - Minimum Pressure Required: {data['min_pressure_constraint']} psi\n"
        prompt += f"  - Number of Pumps: {len(data['pumps'])}\n\n"

        prompt += "Available Pumps:\n"
        for pump in data["pumps"]:
            prompt += f"  - {pump['name']}: Status={pump['status']}, Setpoint={pump['setpoint']}\n"

        prompt += "\nEnergy Prices (24-hour forecast):\n"
        for idx, price in enumerate(data["energy_prices"]):
            # Use timestamp if available, otherwise use index
            timestamp = price.get("timestamp", "")
            # Extract hour from timestamp (format: "2025-11-12 21:00:00+00")
            hour = timestamp.split(" ")[1].split(":")[0] if " " in timestamp else str(idx)
            cost = price["price_per_kwh"]
            off_peak = price.get("is_off_peak", False)
            peak_indicator = " (OFF-PEAK)" if off_peak else " (PEAK)"
            prompt += f"  - Hour {hour}: ${cost:.3f}/kWh{peak_indicator}\n"

        prompt += """
Create an optimal 24-hour pump schedule to minimize energy costs while:
1. Maintaining pressure above the minimum constraint at all times
2. Prioritizing pump operation during off-peak hours
3. Ensuring continuous water availability
4. Avoiding excessive pump cycling (wear and tear)
5. Balancing cost savings vs system reliability

For each pump, provide:
1. Recommended operating schedule (hourly on/off status)
2. Setpoint adjustments if needed
3. Reasoning for the schedule
4. Estimated cost savings vs baseline (running 24/7)
5. Risk assessment (pressure dips, reliability concerns)

Respond ONLY with a JSON object:
{
  "optimizations": [
    {
      "pump_name": "PUMP1",
      "schedule": [
        {"hour": 0, "status": "on|off", "setpoint": 50, "rationale": "..."},
        ...
      ],
      "estimated_daily_savings_usd": 12.50,
      "confidence": 0.95,
      "reasoning": "Detailed explanation..."
    }
  ],
  "overall_strategy": "High-level optimization strategy explanation",
  "risk_assessment": "Analysis of potential risks",
  "pressure_guarantee": "Explanation of how minimum pressure is maintained",
  "total_estimated_savings": 25.00
}
"""
        return prompt

    async def optimize(self) -> Dict[str, Any]:
        """
        Main optimization function - generates optimal pump schedules

        Returns:
            Dictionary containing optimization recommendations
        """
        # Fetch all needed data
        data = await self._fetch_optimization_data()

        if not data.get("energy_prices"):
            return {
                "status": "no_data",
                "message": "No energy price data available for optimization",
            }

        # Prepare prompt
        prompt = self._prepare_prompt(data)

        # Call OpenAI
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an energy optimization expert AI. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,  # Low temperature for more conservative/consistent optimization
                response_format={"type": "json_object"}
            )

            # Parse response
            result = json.loads(response.choices[0].message.content)

            return {
                "status": "success",
                "optimizations": result.get("optimizations", []),
                "overall_strategy": result.get("overall_strategy", ""),
                "risk_assessment": result.get("risk_assessment", ""),
                "pressure_guarantee": result.get("pressure_guarantee", ""),
                "total_estimated_savings": result.get("total_estimated_savings", 0),
                "baseline_data": {
                    "current_avg_pressure": data["current_avg_pressure"],
                    "num_pumps": len(data["pumps"]),
                    "price_range": {
                        "min": min(p["price_per_kwh"] for p in data["energy_prices"]),
                        "max": max(p["price_per_kwh"] for p in data["energy_prices"]),
                    },
                },
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "optimizations": [],
            }

    async def create_decision_record(self, optimization_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create an agent_decision record in Supabase

        Args:
            optimization_result: Output from optimize()

        Returns:
            Created decision record or None if error
        """
        try:
            agent_id = await self._get_agent_id()
            if not agent_id:
                return None

            # Create decision record for the optimization
            decision_data = {
                "agent_id": agent_id,
                "decision_type": "energy_optimization",
                "input_data": optimization_result.get("baseline_data", {}),
                "reasoning": (
                    f"{optimization_result.get('overall_strategy', '')}\n\n"
                    f"Risk Assessment: {optimization_result.get('risk_assessment', '')}\n\n"
                    f"Pressure Guarantee: {optimization_result.get('pressure_guarantee', '')}"
                ),
                "recommendation": {
                    "optimizations": optimization_result.get("optimizations", []),
                    "total_estimated_savings": optimization_result.get("total_estimated_savings", 0),
                },
                "confidence": 0.90,  # High confidence for energy optimization
                "status": "pending",
            }

            # Note: This will fail until agent_decisions table is created
            # result = await supabase_client.insert("agent_decisions", decision_data)
            # return result
            return {"decision": decision_data, "note": "Table agent_decisions needs to be created"}

        except Exception as e:
            print(f"Error creating decision record: {e}")
            return None
