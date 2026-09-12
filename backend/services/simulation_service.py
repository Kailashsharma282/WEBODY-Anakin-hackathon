import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.models import Scenario, Signal, Prediction, utc_now
from backend.schemas.schemas import ScenarioResponse
from backend.services.rlhf_service import rlhf_service

logger = logging.getLogger("webody.simulator")

class SimulationService:
    @staticmethod
    async def generate_scenarios(
        db: AsyncSession,
        signal: Optional[Signal] = None,
        prediction: Optional[Prediction] = None,
        entity_id: Optional[str] = None
    ) -> List[Scenario]:
        """
        Simulator Strategic Scenario Engine.
        Generates 3 calibrated counter-scenarios for executive evaluation:
        Scenario A: DO NOTHING / PASSIVE OBSERVATION
        Scenario B: DIRECT RESPONSE / PRICE MATCH
        Scenario C: DIFFERENTIATE WITH ASYMMETRIC VALUE (Recommended)

        Dynamically calibrates scoring and ranking based on executive RLHF weights
        (risk aversion factor, differentiation preference, margin defense priority).
        """
        is_competitor_x_demo = (
            signal is not None and (
                getattr(signal, "is_demo", False)
                or signal.entity == "Competitor X"
                or "enterprise tier reduced" in signal.title.lower()
            )
        )

        # Pull dynamic RLHF weights
        rlhf_weights = rlhf_service.weights
        diff_pref = rlhf_weights.get("differentiation_preference", 0.50)
        risk_av = rlhf_weights.get("risk_aversion_factor", 0.35)
        margin_def = rlhf_weights.get("margin_defense_priority", 0.60)

        if is_competitor_x_demo:
            # Benchmark baseline scores calibrated with RLHF weighting
            score_a = max(20, min(60, int(42 - (risk_av * 20))))
            score_b = max(40, min(75, int(58 - (margin_def * 15))))
            score_c = max(85, min(99, int(94 + (diff_pref - 0.5) * 10)))

            scenario_defs = [
                {
                    "scenario": "Scenario A: DO NOTHING (Passive Observation)",
                    "score": score_a,
                    "risk": 75,
                    "benefit": 15,
                    "complexity": 5,
                    "recommended": False,
                    "reasoning": (
                        "Est. Downside: Loss of 12-18% of mid-market renewal pipeline to Competitor X's lower price point. "
                        "Strategic Benefit: Zero implementation overhead or engineering distraction. "
                        "Conclusion: High risk of margin erosion and customer churn in upcoming RFP cycles."
                    )
                },
                {
                    "scenario": "Scenario B: MATCH PRICE (-22% Across the Board)",
                    "score": score_b,
                    "risk": 68,
                    "benefit": 60,
                    "complexity": 45,
                    "recommended": False,
                    "reasoning": (
                        "Est. Downside: Immediate $1.2M annualized ARR contraction; triggers race-to-the-bottom pricing war. "
                        "Strategic Benefit: Neutralizes Competitor X's pricing advantage immediately. "
                        "Conclusion: Protects win rate but damages gross margins and investor valuation multiples."
                    )
                },
                {
                    "scenario": "Scenario C: DIFFERENTIATE WITH GOVERNANCE BUNDLE (Recommended)",
                    "score": score_c,
                    "risk": 22,
                    "benefit": 92,
                    "complexity": 35,
                    "recommended": True,
                    "reasoning": (
                        "Est. Downside: Moderate collateral revision required across sales collateral and marketing site. "
                        "Strategic Benefit: Defends existing price point by bundling Acme AI's high-tier 'Governance Suite v2' "
                        "for free to existing enterprise accounts, creating an unassailable compliance moat. "
                        "Conclusion: Transforms competitor price assault into an enterprise value demonstration."
                    )
                }
            ]
        else:
            entity_name = signal.entity if signal else "Target Competitor"
            event_title = signal.title if signal else "Market Movement"

            # Dynamic contextual scenarios for any custom entity
            score_a = max(20, min(55, int(35 + (1 - risk_av) * 15)))
            score_b = max(45, min(75, int(60 - (margin_def * 12))))
            score_c = max(86, min(98, int(92 + (diff_pref - 0.5) * 10)))

            scenario_defs = [
                {
                    "scenario": f"Scenario A: HOLD STRATEGY & MONITOR ({entity_name})",
                    "score": score_a,
                    "risk": 70,
                    "benefit": 20,
                    "complexity": 5,
                    "recommended": False,
                    "reasoning": (
                        f"Passive baseline: Retain existing product packaging while observing market reaction to {entity_name}'s '{event_title}'. "
                        "Minimal operational overhead, but carries high exposure to category churn if early adopter momentum builds."
                    )
                },
                {
                    "scenario": f"Scenario B: SYMMETRICAL DIRECT COUNTER ({entity_name})",
                    "score": score_b,
                    "risk": 55,
                    "benefit": 65,
                    "complexity": 50,
                    "recommended": False,
                    "reasoning": (
                        f"Direct matching: Launch symmetrical feature or packaging adjustment to directly neutralize {entity_name}'s initiative. "
                        "Protects immediate pipeline parity, but triggers commoditization risk and engineering sprint churn."
                    )
                },
                {
                    "scenario": f"Scenario C: ASYMMETRIC VALUE DIFFERENTIATION (Recommended)",
                    "score": score_c,
                    "risk": 20,
                    "benefit": 90,
                    "complexity": 30,
                    "recommended": True,
                    "reasoning": (
                        f"Asymmetric counter: Shift enterprise value narrative away from {entity_name}'s move by bundling "
                        "proprietary SLA assurances, immutable audit trails, and zero-downtime guarantees. "
                        "Transforms competitor pressure into a high-margin enterprise proof point."
                    )
                }
            ]

        # Ensure exactly one recommended scenario with highest score
        scenario_defs.sort(key=lambda x: x["score"], reverse=True)
        for i, s_def in enumerate(scenario_defs):
            s_def["recommended"] = (i == 0)

        created_scenarios = []
        for s_def in scenario_defs:
            sc = Scenario(
                entity_id=entity_id or (signal.entity_id if signal else None),
                signal_id=signal.id if signal else None,
                prediction_id=prediction.id if prediction else None,
                scenario=s_def["scenario"],
                score=s_def["score"],
                risk=s_def["risk"],
                benefit=s_def["benefit"],
                complexity=s_def["complexity"],
                reasoning=s_def["reasoning"],
                recommended=s_def["recommended"],
                created_at=utc_now()
            )
            db.add(sc)
            created_scenarios.append(sc)

        await db.commit()
        for sc in created_scenarios:
            await db.refresh(sc)

        return created_scenarios

simulation_service = SimulationService()
