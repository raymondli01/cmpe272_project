"""
Safety Monitor Agent

Continuous monitoring of pressure, water quality, and system safety.
Zero tolerance for safety violations - immediate alerts and recommendations.
"""
import os
import json
from typing import Dict, List, Any, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv
from .supabase_client import supabase_client

load_dotenv()


class SafetyMonitorAgent:
    """
    AI Agent for safety monitoring

    Monitors pressure levels, water quality indicators, and system anomalies
    with zero tolerance for safety violations.
    """

    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.agent_name = "Safety Monitor Agent"
        self.agent_id = None

        # Safety thresholds
        self.critical_low_pressure = 30  # psi - Critical safety level
        self.min_safe_pressure = 40  # psi - Minimum safe operating pressure
        self.max_safe_pressure = 120  # psi - Maximum to prevent pipe damage

    async def _get_agent_id(self) -> str:
        """Get agent ID from database"""
        if not self.agent_id:
            agent = await supabase_client.get_agent_by_name(self.agent_name)
            if agent:
                self.agent_id = agent["id"]
        return self.agent_id

    async def _fetch_safety_data(self) -> Dict[str, Any]:
        """
        Fetch all sensors and system state for safety monitoring

        Returns:
            Dictionary with sensor readings and system state
        """
        # Get all sensors
        sensors = await supabase_client.get_sensors_with_assets()

        # Categorize sensors
        pressure_sensors = [s for s in sensors if s["type"] == "pressure"]
        flow_sensors = [s for s in sensors if s["type"] == "flow"]
        acoustic_sensors = [s for s in sensors if s["type"] == "acoustic"]

        # Get valves and pumps status
        valves_pumps = await supabase_client.get_valves_pumps()

        return {
            "pressure_sensors": pressure_sensors,
            "flow_sensors": flow_sensors,
            "acoustic_sensors": acoustic_sensors,
            "valves_pumps": valves_pumps,
            "thresholds": {
                "critical_low_pressure": self.critical_low_pressure,
                "min_safe_pressure": self.min_safe_pressure,
                "max_safe_pressure": self.max_safe_pressure,
            },
        }

    def _prepare_prompt(self, data: Dict[str, Any]) -> str:
        """
        Prepare safety monitoring prompt for OpenAI

        Args:
            data: Safety data from _fetch_safety_data()

        Returns:
            Formatted prompt string
        """
        prompt = """You are a water system safety monitoring AI with ZERO TOLERANCE for safety violations.

Your task is to analyze real-time sensor data and identify ANY safety concerns, anomalies, or violations.

Safety Thresholds:
"""
        thresholds = data["thresholds"]
        prompt += f"  - Critical Low Pressure: < {thresholds['critical_low_pressure']} psi (EMERGENCY)\n"
        prompt += f"  - Minimum Safe Pressure: {thresholds['min_safe_pressure']} psi\n"
        prompt += f"  - Maximum Safe Pressure: {thresholds['max_safe_pressure']} psi\n\n"

        prompt += "Current Sensor Readings:\n\n"

        prompt += "Pressure Sensors:\n"
        for sensor in data["pressure_sensors"]:
            value = sensor["value"]
            status_flag = ""
            if value < thresholds["critical_low_pressure"]:
                status_flag = " ⚠️ CRITICAL"
            elif value < thresholds["min_safe_pressure"]:
                status_flag = " ⚠️ LOW"
            elif value > thresholds["max_safe_pressure"]:
                status_flag = " ⚠️ HIGH"
            prompt += f"  - Asset {sensor['asset_id']}: {value} {sensor['unit']}{status_flag}\n"

        prompt += "\nFlow Sensors:\n"
        for sensor in data["flow_sensors"]:
            prompt += f"  - Asset {sensor['asset_id']}: {sensor['value']} {sensor['unit']}\n"

        prompt += "\nAcoustic Sensors:\n"
        for sensor in data["acoustic_sensors"]:
            prompt += f"  - Asset {sensor['asset_id']}: {sensor['value']} {sensor['unit']}\n"

        prompt += "\nValves and Pumps:\n"
        for vp in data["valves_pumps"]:
            prompt += f"  - {vp['name']} ({vp['kind']}): {vp['status']}\n"

        prompt += """
Analyze this data for safety issues:

1. **Pressure Violations**:
   - Critical low pressure (< 30 psi) = EMERGENCY - immediate action required
   - Low pressure (< 40 psi) = WARNING - investigate and address
   - High pressure (> 120 psi) = WARNING - risk of pipe damage

2. **System Anomalies**:
   - Unusual flow patterns (sudden spikes or drops)
   - Acoustic anomalies (possible leaks or equipment issues)
   - Pump/valve malfunctions

3. **Cascading Risks**:
   - Multiple sensors showing concerning trends
   - Patterns that could lead to system failure
   - Contamination risks

For EACH safety concern identified, provide:
- Severity level (CRITICAL, HIGH, MEDIUM, LOW)
- Affected components/locations
- Detailed reasoning
- Immediate actions required
- Estimated time to failure (if applicable)

Respond ONLY with a JSON object:
{
  "safety_status": "SAFE|WARNING|CRITICAL",
  "issues": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "pressure|flow|acoustic|equipment",
      "affected_assets": ["asset-id-1", "asset-id-2"],
      "description": "Clear description of the issue",
      "reasoning": "Why this is a safety concern...",
      "immediate_actions": ["Action 1", "Action 2"],
      "estimated_time_to_failure": "immediate|hours|days|N/A",
      "confidence": 0.95
    }
  ],
  "overall_assessment": "Summary of system safety state",
  "monitoring_recommendations": ["Continue monitoring X", "Increase sensor frequency for Y"]
}

If system is SAFE, return:
{
  "safety_status": "SAFE",
  "issues": [],
  "overall_assessment": "All systems operating within safe parameters",
  "monitoring_recommendations": []
}
"""
        return prompt

    async def monitor(self) -> Dict[str, Any]:
        """
        Main monitoring function - checks safety and returns issues

        Returns:
            Dictionary containing safety assessment
        """
        # Fetch safety data
        data = await self._fetch_safety_data()

        if not data.get("pressure_sensors"):
            return {
                "status": "no_data",
                "safety_status": "UNKNOWN",
                "message": "No sensor data available for safety monitoring",
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
                        "content": "You are a safety monitoring expert AI with zero tolerance for safety violations. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.0,  # Zero temperature - we want deterministic safety checks
                response_format={"type": "json_object"}
            )

            # Parse response
            result = json.loads(response.choices[0].message.content)

            # Categorize issues by severity
            critical_issues = [
                issue for issue in result.get("issues", [])
                if issue.get("severity") == "CRITICAL"
            ]
            high_issues = [
                issue for issue in result.get("issues", [])
                if issue.get("severity") == "HIGH"
            ]

            return {
                "status": "success",
                "safety_status": result.get("safety_status", "UNKNOWN"),
                "issues": result.get("issues", []),
                "critical_issues": critical_issues,
                "high_issues": high_issues,
                "overall_assessment": result.get("overall_assessment", ""),
                "monitoring_recommendations": result.get("monitoring_recommendations", []),
                "sensor_counts": {
                    "pressure": len(data["pressure_sensors"]),
                    "flow": len(data["flow_sensors"]),
                    "acoustic": len(data["acoustic_sensors"]),
                },
            }

        except Exception as e:
            return {
                "status": "error",
                "safety_status": "UNKNOWN",
                "error": str(e),
                "issues": [],
            }

    async def create_decision_record(self, monitoring_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create an agent_decision record in Supabase for safety issues

        Args:
            monitoring_result: Output from monitor()

        Returns:
            Created decision records or None if error
        """
        try:
            agent_id = await self._get_agent_id()
            if not agent_id:
                return None

            # Create decision records for critical and high severity issues
            decisions = []
            for issue in monitoring_result.get("critical_issues", []) + monitoring_result.get("high_issues", []):
                decision_data = {
                    "agent_id": agent_id,
                    "decision_type": "safety_violation",
                    "input_data": {
                        "affected_assets": issue.get("affected_assets", []),
                        "category": issue.get("category", ""),
                        "severity": issue.get("severity", ""),
                        "sensor_counts": monitoring_result.get("sensor_counts", {}),
                    },
                    "reasoning": issue.get("reasoning", ""),
                    "recommendation": {
                        "immediate_actions": issue.get("immediate_actions", []),
                        "estimated_time_to_failure": issue.get("estimated_time_to_failure", ""),
                    },
                    "confidence": issue.get("confidence", 1.0),
                    "status": "pending",
                }
                decisions.append(decision_data)

            if decisions:
                # Note: This will fail until agent_decisions table is created
                # result = await supabase_client.insert("agent_decisions", decisions)
                # return result
                return {"decisions": decisions, "note": "Table agent_decisions needs to be created"}

            return None

        except Exception as e:
            print(f"Error creating decision record: {e}")
            return None
