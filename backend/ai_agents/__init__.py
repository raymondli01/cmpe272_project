"""
AI Agents Module for AWARE Water Management System

This module contains three specialized AI agents:
- LeakPreemptionAgent: Predictive leak detection using sensor fusion
- EnergyOptimizerAgent: Pump/tank scheduling optimization
- SafetyMonitorAgent: Continuous safety and pressure monitoring
"""

from .leak_preemption_agent import LeakPreemptionAgent
from .energy_optimizer_agent import EnergyOptimizerAgent
from .safety_monitor_agent import SafetyMonitorAgent
from .agent_coordinator import AgentCoordinator

__all__ = [
    "LeakPreemptionAgent",
    "EnergyOptimizerAgent",
    "SafetyMonitorAgent",
    "AgentCoordinator",
]
