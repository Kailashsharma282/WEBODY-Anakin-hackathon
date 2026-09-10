import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.models import Scenario, Signal, Prediction, utc_now
from backend.schemas.schemas import ScenarioResponse

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
        Scenario A: DO NOTHING
        Scenario B: MATCH PRICE
        Scenario C: DIFFERENTIATE WITH GOVERNANCE BUNDLE (Recommended)
        """
        scenario_defs = [
            {
                "scenario": "Scenario A: DO NOTHING (Passive Observation)",
                "score": 42,
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
                "score": 58,
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
                "score": 94,
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
