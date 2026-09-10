import logging
from typing import Dict, Any, List
from datetime import datetime, timezone

logger = logging.getLogger("webody.rlhf")

class RLHFService:
    """
    Continuous Human-in-the-Loop (RLHF) Preference Learner.
    Tracks executive scenario selections, rejections, and manual override decisions
    to calibrate future Simulator ranking heuristics to match the organization's
    specific risk appetite and strategic posture.
    """

    def __init__(self):
        # In-memory preference history
        self.decision_history: List[Dict[str, Any]] = []
        # Dynamic preference weights
        self.weights = {
            "risk_aversion_factor": 0.35,
            "differentiation_preference": 0.50,
            "speed_to_market_preference": 0.40,
            "margin_defense_priority": 0.60
        }

    def record_decision(
        self,
        chosen_scenario: str,
        score: int,
        risk: int,
        benefit: int,
        complexity: int,
        rejected_scenarios: List[str] = None
    ) -> Dict[str, Any]:
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "chosen_scenario": chosen_scenario,
            "metrics": {
                "score": score,
                "risk": risk,
                "benefit": benefit,
                "complexity": complexity
            },
            "rejected_scenarios": rejected_scenarios or []
        }
        self.decision_history.append(record)

        # Adapt weights based on choice:
        # If user repeatedly picks "DIFFERENTIATE" over "MATCH PRICE", increase differentiation & margin defense weights
        if "differentiate" in chosen_scenario.lower():
            self.weights["differentiation_preference"] = min(0.95, self.weights["differentiation_preference"] + 0.05)
            self.weights["margin_defense_priority"] = min(0.95, self.weights["margin_defense_priority"] + 0.05)
        elif "match" in chosen_scenario.lower():
            self.weights["speed_to_market_preference"] = min(0.95, self.weights["speed_to_market_preference"] + 0.05)
            self.weights["risk_aversion_factor"] = max(0.10, self.weights["risk_aversion_factor"] - 0.03)

        logger.info(f"Recorded RLHF scenario decision: '{chosen_scenario}'. Updated weights: {self.weights}")

        return {
            "total_decisions_recorded": len(self.decision_history),
            "updated_weights": self.weights,
            "executive_profile": "VALUE DIFFERENTIATOR / MARGIN DEFENDER" if self.weights["differentiation_preference"] > 0.6 else "AGILE PRICING MATCH"
        }

    def get_current_profile(self) -> Dict[str, Any]:
        return {
            "total_decisions": len(self.decision_history),
            "weights": self.weights,
            "executive_persona": (
                "Strategic Value Differentiator: Strongly prefers maintaining gross margins through feature bundling "
                "over entering destructive price wars."
                if self.weights["differentiation_preference"] >= 0.5
                else "Aggressive Market Share Acquirer: Willing to match price cuts to starve competitor momentum."
            )
        }

rlhf_service = RLHFService()
