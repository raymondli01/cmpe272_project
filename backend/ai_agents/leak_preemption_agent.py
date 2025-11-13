"""
Leak Preemption Agent

Uses sensor fusion (acoustic + pressure + flow) and OpenAI to predict leaks before they occur.
Implements confidence-scored leak detection with explainability.
"""
import os
import json
from typing import Dict, List, Any, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv
from .supabase_client import supabase_client

load_dotenv()


class LeakPreemptionAgent:
    """
    AI Agent for predictive leak detection

    Fuses acoustic, pressure, and flow sensor data to predict leak likelihood
    with confidence scores and actionable recommendations.
    """

    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.agent_name = "Leak Preemption Agent"
        self.confidence_threshold = 0.84  # 84% as per spec
        self.agent_id = None

    async def _get_agent_id(self) -> str:
        """Get agent ID from database"""
        if not self.agent_id:
            agent = await supabase_client.get_agent_by_name(self.agent_name)
            if agent:
                self.agent_id = agent["id"]
        return self.agent_id

    async def _fetch_sensor_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Fetch and organize sensor data by edge (pipe)

        Returns:
            Dictionary mapping edge_id to list of sensors
        """
        sensors = await supabase_client.get_sensors_with_assets()

        # Group sensors by edge
        edges_data = {}
        for sensor in sensors:
            asset_id = sensor["asset_id"]
            asset_type = sensor["asset_type"]

            # We're interested in edge (pipe) sensors
            if asset_type == "edge":
                if asset_id not in edges_data:
                    edges_data[asset_id] = []
                edges_data[asset_id].append(sensor)

        return edges_data

    def _prepare_prompt(self, edge_data: Dict[str, List[Dict[str, Any]]]) -> str:
        """
        Prepare prompt for OpenAI with sensor data

        Args:
            edge_data: Dictionary of edge sensors

        Returns:
            Formatted prompt string
        """
        prompt = """You are an expert leak detection AI agent for water distribution systems.

Your task is to analyze sensor data from water pipes and predict leak likelihood using sensor fusion.

Sensor Data by Pipe:
"""
        for edge_id, sensors in edge_data.items():
            prompt += f"\n--- Pipe {edge_id} ---\n"
            for sensor in sensors:
                prompt += f"  - {sensor['type']}: {sensor['value']} {sensor['unit']} (last seen: {sensor['last_seen']})\n"

        prompt += """
Analyze this data and identify ANY pipes that show leak indicators. For each pipe with potential leak risk:

1. Calculate a confidence score (0.0 to 1.0) based on:
   - High acoustic readings (unusual vibrations/noise)
   - Low pressure readings (indicating pressure loss)
   - High flow readings (unexpected water movement)
   - Combinations of these factors

2. Provide reasoning explaining:
   - What patterns you observed in the sensor data
   - Why these patterns suggest a leak
   - Which sensor readings are most concerning
   - The urgency level (immediate, soon, monitor)

3. Recommend specific actions:
   - Which valves to isolate (if confidence > 0.84)
   - Whether to dispatch maintenance crew
   - Additional sensors to monitor

Respond ONLY with a JSON array of leak predictions (even if empty):
[
  {
    "edge_id": "edge-uuid",
    "confidence": 0.92,
    "urgency": "immediate|soon|monitor",
    "reasoning": "Detailed explanation of why this pipe likely has a leak...",
    "sensor_indicators": {
      "acoustic": "high|normal|low and explanation",
      "pressure": "high|normal|low and explanation",
      "flow": "high|normal|low and explanation"
    },
    "recommendation": {
      "action": "isolate|monitor|inspect",
      "valves_to_close": ["V1", "V2"],
      "dispatch_crew": true,
      "estimated_location": "description"
    }
  }
]

If no leaks are detected, return an empty array: []
"""
        return prompt

    async def analyze(self) -> Dict[str, Any]:
        """
        Main analysis function - detects leaks and generates recommendations

        Returns:
            Dictionary containing leak predictions and metadata
        """
        # Fetch sensor data
        edge_data = await self._fetch_sensor_data()

        if not edge_data:
            return {
                "status": "no_data",
                "leaks_detected": [],
                "message": "No sensor data available for analysis"
            }

        # Prepare prompt
        prompt = self._prepare_prompt(edge_data)

        # Call OpenAI
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a leak detection expert AI. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,  # Low temperature for consistency
                response_format={"type": "json_object"}
            )

            # Parse response
            result_text = response.choices[0].message.content

            # Handle both object and array responses
            try:
                result = json.loads(result_text)
                # If result is an object with a key containing array, extract it
                if isinstance(result, dict):
                    # Look for array in the response
                    for key, value in result.items():
                        if isinstance(value, list):
                            leaks = value
                            break
                    else:
                        leaks = []
                else:
                    leaks = result
            except json.JSONDecodeError:
                leaks = []

            # Filter leaks by confidence threshold for action
            actionable_leaks = [
                leak for leak in leaks
                if leak.get("confidence", 0) >= self.confidence_threshold
            ]

            return {
                "status": "success",
                "leaks_detected": leaks,
                "actionable_leaks": actionable_leaks,
                "confidence_threshold": self.confidence_threshold,
                "sensor_count": sum(len(sensors) for sensors in edge_data.values()),
                "pipes_analyzed": len(edge_data),
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "leaks_detected": [],
            }

    async def create_decision_record(self, analysis_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create an agent_decision record in Supabase

        Args:
            analysis_result: Output from analyze()

        Returns:
            Created decision record or None if error
        """
        try:
            agent_id = await self._get_agent_id()
            if not agent_id:
                return None

            # Create decision for each actionable leak
            decisions = []
            for leak in analysis_result.get("actionable_leaks", []):
                decision_data = {
                    "agent_id": agent_id,
                    "decision_type": "leak_detection",
                    "input_data": {
                        "edge_id": leak.get("edge_id"),
                        "sensor_indicators": leak.get("sensor_indicators"),
                        "pipes_analyzed": analysis_result.get("pipes_analyzed"),
                    },
                    "reasoning": leak.get("reasoning", ""),
                    "recommendation": leak.get("recommendation", {}),
                    "confidence": leak.get("confidence", 0),
                    "status": "pending",
                }
                decisions.append(decision_data)

            if decisions:
                # Note: This will fail until agent_decisions table is created
                # For now, we return the prepared data
                # result = await supabase_client.insert("agent_decisions", decisions)
                # return result
                return {"decisions": decisions, "note": "Table agent_decisions needs to be created"}

            return None

        except Exception as e:
            print(f"Error creating decision record: {e}")
            return None
