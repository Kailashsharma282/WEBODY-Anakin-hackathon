import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.models.models import (
    Entity, Relationship, Signal, TimelineEvent, Prediction, Scenario, Action, utc_now
)
from backend.schemas.schemas import GraphNode, GraphEdge, WorldGraphResponse

logger = logging.getLogger("webody.world_model")

VALID_RELATIONSHIPS = [
    "competes_with", "owns", "sells", "integrates_with", "depends_on",
    "hires_for", "targets", "announced", "changed", "references", "replaces", "related_to"
]

class WorldModelService:
    @staticmethod
    async def get_or_create_entity(
        db: AsyncSession,
        name: str,
        entity_type: str = "company",
        domain: Optional[str] = None,
        description: Optional[str] = None,
        importance: int = 50
    ) -> Entity:
        stmt = select(Entity).where(Entity.name == name)
        res = await db.execute(stmt)
        entity = res.scalars().first()
        if not entity:
            entity = Entity(
                name=name,
                entity_type=entity_type,
                domain=domain,
                description=description,
                importance=importance,
                status="active"
            )
            db.add(entity)
            await db.commit()
            await db.refresh(entity)
        return entity

    @staticmethod
    async def update_relationship(
        db: AsyncSession,
        source_id: str,
        target_id: str,
        rel_type: str,
        confidence: int = 80,
        current_val: Optional[str] = None,
        source_info: Optional[str] = None
    ) -> Relationship:
        """
        Updates relationship state preserving previous value without blindly overwriting history.
        """
        stmt = select(Relationship).where(
            Relationship.source_entity_id == source_id,
            Relationship.target_entity_id == target_id,
            Relationship.relationship_type == rel_type
        )
        res = await db.execute(stmt)
        rel = res.scalars().first()

        if rel:
            rel.previous_value = rel.current_value
            rel.current_value = current_val or rel.current_value
            rel.confidence = confidence
            rel.source = source_info or rel.source
            rel.observed_at = utc_now()
        else:
            rel = Relationship(
                source_entity_id=source_id,
                target_entity_id=target_id,
                relationship_type=rel_type,
                confidence=confidence,
                current_value=current_val,
                source=source_info,
                observed_at=utc_now()
            )
            db.add(rel)

        await db.commit()
        await db.refresh(rel)
        return rel

    @staticmethod
    async def get_world_graph(db: AsyncSession) -> WorldGraphResponse:
        """
        Retrieves the complete living persistent graph for interactive visualization.
        """
        entities_res = await db.execute(select(Entity))
        entities = entities_res.scalars().all()

        rels_res = await db.execute(select(Relationship))
        rels = rels_res.scalars().all()

        nodes = [
            GraphNode(
                id=e.id,
                label=e.name,
                type=e.entity_type,
                status=e.status,
                importance=e.importance,
                meta_data=e.meta_data or {}
            )
            for e in entities
        ]

        edges = [
            GraphEdge(
                id=r.id,
                source=r.source_entity_id,
                target=r.target_entity_id,
                type=r.relationship_type,
                confidence=r.confidence,
                current_value=r.current_value,
                previous_value=r.previous_value
            )
            for r in rels
        ]

        return WorldGraphResponse(nodes=nodes, edges=edges)

    @staticmethod
    async def get_entity_profile(db: AsyncSession, entity_id: str) -> Optional[Dict[str, Any]]:
        """
        Loads the rich 10-part Entity Profile specified in Section 15 of the PDF:
        OVERVIEW, CURRENT STATE, RECENT CHANGES, WHY IT MATTERS, RELATED ENTITIES,
        TIMELINE, PREDICTIONS, SIMULATIONS, EVIDENCE, ACTIONS.
        """
        stmt = select(Entity).where(Entity.id == entity_id).options(
            selectinload(Entity.signals),
            selectinload(Entity.timeline_events),
            selectinload(Entity.predictions),
            selectinload(Entity.scenarios),
            selectinload(Entity.actions),
            selectinload(Entity.out_relationships).selectinload(Relationship.target_entity),
            selectinload(Entity.in_relationships).selectinload(Relationship.source_entity)
        )
        res = await db.execute(stmt)
        entity = res.scalars().first()
        if not entity:
            return None

        related = []
        for r in entity.out_relationships:
            if r.target_entity:
                related.append({
                    "entity_id": r.target_entity.id,
                    "name": r.target_entity.name,
                    "relationship": r.relationship_type,
                    "direction": "outgoing",
                    "confidence": r.confidence,
                    "current_value": r.current_value
                })
        for r in entity.in_relationships:
            if r.source_entity:
                related.append({
                    "entity_id": r.source_entity.id,
                    "name": r.source_entity.name,
                    "relationship": r.relationship_type,
                    "direction": "incoming",
                    "confidence": r.confidence,
                    "current_value": r.current_value
                })

        # Recent changes inferred from signals
        recent_changes = [
            {
                "id": s.id,
                "title": s.title,
                "event_type": s.event_type,
                "timestamp": s.timestamp.isoformat(),
                "importance": s.importance
            }
            for s in sorted(entity.signals, key=lambda x: x.timestamp, reverse=True)[:5]
        ]

        timeline = [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "timestamp": t.timestamp.isoformat(),
                "event_type": t.event_type,
                "confidence": t.confidence,
                "impact": t.impact
            }
            for t in sorted(entity.timeline_events, key=lambda x: x.timestamp, reverse=True)
        ]

        predictions = [
            {
                "id": p.id,
                "prediction": p.prediction,
                "probability": p.probability,
                "time_window": p.time_window,
                "confidence": p.confidence,
                "reasoning": p.reasoning
            }
            for p in entity.predictions
        ]

        simulations = [
            {
                "id": sc.id,
                "scenario": sc.scenario,
                "score": sc.score,
                "risk": sc.risk,
                "benefit": sc.benefit,
                "complexity": sc.complexity,
                "reasoning": sc.reasoning,
                "recommended": sc.recommended
            }
            for sc in entity.scenarios
        ]

        actions = [
            {
                "id": a.id,
                "action_id": a.action_id,
                "name": a.name,
                "status": a.status,
                "approved": a.approved,
                "execution_result": a.execution_result
            }
            for a in entity.actions
        ]

        return {
            "id": entity.id,
            "overview": {
                "name": entity.name,
                "entity_type": entity.entity_type,
                "domain": entity.domain,
                "description": entity.description or "Monitored entity inside the living world model.",
                "importance": entity.importance,
                "status": entity.status
            },
            "current_state": {
                "active_signals_count": len(entity.signals),
                "relationships_count": len(related),
                "threat_level": "Elevated" if any(s.severity == "critical" for s in entity.signals) else "Nominal",
                "last_observed": entity.updated_at.isoformat() if entity.updated_at else None
            },
            "recent_changes": recent_changes,
            "why_it_matters": f"{entity.name} directly influences Acme AI's enterprise market share. Recent strategic pivots could disrupt pricing dynamics and vendor evaluation cycles.",
            "related_entities": related,
            "timeline": timeline,
            "predictions": predictions,
            "simulations": simulations,
            "evidence": [
                {
                    "source": entity.domain or "web-intelligence",
                    "claim": f"Historical pricing patterns for {entity.name}",
                    "confidence": 92
                }
            ],
            "actions": actions
        }

    @staticmethod
    async def seed_initial_world(db: AsyncSession):
        """
        Seeds Acme AI (center node) and peripheral ecosystem entities & relationships.
        """
        # Center Node: Acme AI (USER COMPANY)
        acme = await WorldModelService.get_or_create_entity(
            db, "Acme AI", entity_type="company", domain="acme.ai",
            description="Our primary operating business: Enterprise Generative AI platform.", importance=100
        )
        
        comp_x = await WorldModelService.get_or_create_entity(
            db, "Competitor X", entity_type="competitor", domain="competitorx.ai",
            description="Key enterprise AI competitor in EMEA & North America.", importance=95
        )

        aws = await WorldModelService.get_or_create_entity(
            db, "AWS Cloud", entity_type="vendor", domain="aws.amazon.com",
            description="Primary cloud compute and model hosting vendor.", importance=85
        )

        langchain = await WorldModelService.get_or_create_entity(
            db, "LangChain", entity_type="technology", domain="langchain.com",
            description="Agentic framework and component dependency.", importance=75
        )

        eu_reg = await WorldModelService.get_or_create_entity(
            db, "EU AI Act Board", entity_type="regulator", domain="artificialintelligenceact.eu",
            description="High-risk AI compliance governing body.", importance=90
        )

        gov_suite = await WorldModelService.get_or_create_entity(
            db, "Governance Suite v2", entity_type="product", domain="acme.ai/governance",
            description="Internal strategic product for compliance guardrails.", importance=80
        )

        enterprise_clients = await WorldModelService.get_or_create_entity(
            db, "Global 2000 Buyers", entity_type="customer", domain="enterprise-market.org",
            description="Tier 1 target enterprise customer segment.", importance=90
        )

        ai_narratives = await WorldModelService.get_or_create_entity(
            db, "Enterprise AI Safety Narrative", entity_type="narrative", domain="ai-visibility.anakin.io",
            description="Dominant market discourse regarding model risk and compliance.", importance=88
        )

        # Connect initial relationships
        await WorldModelService.update_relationship(
            db, comp_x.id, acme.id, "competes_with", confidence=95, current_val="Direct Enterprise Head-to-Head"
        )
        await WorldModelService.update_relationship(
            db, acme.id, aws.id, "depends_on", confidence=90, current_val="GPU Cluster & Bedrock APIs"
        )
        await WorldModelService.update_relationship(
            db, acme.id, langchain.id, "integrates_with", confidence=85, current_val="Agent Runtime v0.2"
        )
        await WorldModelService.update_relationship(
            db, acme.id, eu_reg.id, "targets", confidence=88, current_val="Full Article 50 Compliance"
        )
        await WorldModelService.update_relationship(
            db, acme.id, gov_suite.id, "owns", confidence=100, current_val="Internal Core IP"
        )
        await WorldModelService.update_relationship(
            db, acme.id, enterprise_clients.id, "sells", confidence=92, current_val="Annual SaaS Subscriptions"
        )
        await WorldModelService.update_relationship(
            db, comp_x.id, enterprise_clients.id, "targets", confidence=94, current_val="Discount Pricing Campaign"
        )
        await WorldModelService.update_relationship(
            db, comp_x.id, ai_narratives.id, "related_to", confidence=91, current_val="Recent Governance Marketing Pivot"
        )

world_model_service = WorldModelService()
