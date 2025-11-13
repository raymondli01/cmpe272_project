"""
Agent Coordinator

Orchestrates multiple AI agents and coordinates their decisions.
Handles conflicts, prioritization, and unified decision making.
"""
from typing import Dict, List, Any
from .leak_preemption_agent import LeakPreemptionAgent
from .energy_optimizer_agent import EnergyOptimizerAgent
from .safety_monitor_agent import SafetyMonitorAgent


class AgentCoordinator:
    """
    Coordinates multiple AI agents

    Manages agent execution order, conflict resolution, and decision prioritization.
    Safety Monitor has highest priority, followed by Leak Preemption, then Energy Optimization.
    """

    def __init__(self):
        self.leak_agent = LeakPreemptionAgent()
        self.energy_agent = EnergyOptimizerAgent()
        self.safety_agent = SafetyMonitorAgent()

    async def run_all_agents(self) -> Dict[str, Any]:
        """
        Execute all agents and coordinate their recommendations

        Returns:
            Coordinated recommendations from all agents with priority ordering
        """
        results = {}

        # 1. Safety Monitor - Highest Priority (always runs first)
        print("Running Safety Monitor Agent...")
        safety_result = await self.safety_agent.monitor()
        results["safety"] = safety_result

        # If CRITICAL safety issues, don't run other agents - safety takes precedence
        if safety_result.get("safety_status") == "CRITICAL":
            return {
                "status": "critical_safety_override",
                "message": "Critical safety issues detected - all other operations suspended",
                "results": results,
                "priority_actions": self._extract_critical_actions(safety_result),
            }

        # 2. Leak Preemption Agent - High Priority
        print("Running Leak Preemption Agent...")
        leak_result = await self.leak_agent.analyze()
        results["leak_detection"] = leak_result

        # 3. Energy Optimizer Agent - Normal Priority
        # Only run if no critical leaks (confidence > 0.95)
        critical_leaks = [
            leak for leak in leak_result.get("leaks_detected", [])
            if leak.get("confidence", 0) > 0.95
        ]

        if critical_leaks:
            results["energy_optimization"] = {
                "status": "skipped",
                "message": "Critical leaks detected - energy optimization deferred",
            }
        else:
            print("Running Energy Optimizer Agent...")
            energy_result = await self.energy_agent.optimize()
            results["energy_optimization"] = energy_result

        # Coordinate and prioritize recommendations
        coordinated = self._coordinate_decisions(results)

        return {
            "status": "success",
            "results": results,
            "coordinated_actions": coordinated,
        }

    async def run_leak_detection(self) -> Dict[str, Any]:
        """Run only leak detection agent"""
        return await self.leak_agent.analyze()

    async def run_energy_optimization(self) -> Dict[str, Any]:
        """Run only energy optimization agent"""
        return await self.energy_agent.optimize()

    async def run_safety_monitoring(self) -> Dict[str, Any]:
        """Run only safety monitoring agent"""
        return await self.safety_agent.monitor()

    def _extract_critical_actions(self, safety_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract critical actions from safety monitoring results

        Args:
            safety_result: Output from safety agent

        Returns:
            List of critical actions with priority ordering
        """
        actions = []

        for issue in safety_result.get("critical_issues", []):
            actions.append({
                "priority": "CRITICAL",
                "agent": "Safety Monitor",
                "description": issue.get("description", ""),
                "immediate_actions": issue.get("immediate_actions", []),
                "affected_assets": issue.get("affected_assets", []),
                "confidence": issue.get("confidence", 1.0),
            })

        return actions

    def _coordinate_decisions(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Coordinate decisions from all agents

        Priority order:
        1. CRITICAL safety issues
        2. HIGH safety issues
        3. Actionable leaks (confidence >= 0.84)
        4. Energy optimizations (if no conflicts)

        Args:
            results: Results from all agents

        Returns:
            Coordinated action plan
        """
        coordinated = {
            "immediate_actions": [],
            "scheduled_actions": [],
            "monitoring_actions": [],
            "conflicts": [],
        }

        # 1. Add critical safety issues (immediate actions)
        safety_result = results.get("safety", {})
        for issue in safety_result.get("critical_issues", []):
            coordinated["immediate_actions"].append({
                "priority": "CRITICAL",
                "agent": "Safety Monitor",
                "type": "safety_violation",
                "description": issue.get("description", ""),
                "actions": issue.get("immediate_actions", []),
                "confidence": issue.get("confidence", 1.0),
            })

        # 2. Add high priority safety issues
        for issue in safety_result.get("high_issues", []):
            coordinated["immediate_actions"].append({
                "priority": "HIGH",
                "agent": "Safety Monitor",
                "type": "safety_warning",
                "description": issue.get("description", ""),
                "actions": issue.get("immediate_actions", []),
                "confidence": issue.get("confidence", 1.0),
            })

        # 3. Add actionable leaks
        leak_result = results.get("leak_detection", {})
        for leak in leak_result.get("actionable_leaks", []):
            coordinated["immediate_actions"].append({
                "priority": "HIGH",
                "agent": "Leak Preemption",
                "type": "leak_detection",
                "description": leak.get("reasoning", ""),
                "actions": [leak.get("recommendation", {}).get("action", "")],
                "confidence": leak.get("confidence", 0),
                "valves_to_close": leak.get("recommendation", {}).get("valves_to_close", []),
            })

        # 4. Add energy optimizations (scheduled actions, not immediate)
        energy_result = results.get("energy_optimization", {})
        if energy_result.get("status") == "success":
            coordinated["scheduled_actions"].append({
                "priority": "NORMAL",
                "agent": "Energy Optimizer",
                "type": "optimization",
                "description": energy_result.get("overall_strategy", ""),
                "estimated_savings": energy_result.get("total_estimated_savings", 0),
                "schedule": energy_result.get("optimizations", []),
            })

        # 5. Add monitoring recommendations
        coordinated["monitoring_actions"] = safety_result.get("monitoring_recommendations", [])

        # 6. Detect conflicts (e.g., energy optimization wants to turn off pump, but leak detection needs it)
        coordinated["conflicts"] = self._detect_conflicts(results)

        return coordinated

    def _detect_conflicts(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Detect conflicts between agent recommendations

        Args:
            results: Results from all agents

        Returns:
            List of detected conflicts
        """
        conflicts = []

        # Example: Check if energy optimizer wants to turn off pumps while leaks need pressure
        leak_result = results.get("leak_detection", {})
        energy_result = results.get("energy_optimization", {})

        if leak_result.get("actionable_leaks") and energy_result.get("status") == "success":
            conflicts.append({
                "type": "priority_conflict",
                "description": "Leak detection requires full pressure while energy optimization suggests reducing pump usage",
                "resolution": "Leak detection takes priority - defer energy optimization",
                "agents_involved": ["Leak Preemption", "Energy Optimizer"],
            })

        return conflicts
