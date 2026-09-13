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
        entities = list(entities_res.scalars().all())

        if not entities:
            await WorldModelService.seed_initial_world(db)
            entities_res = await db.execute(select(Entity))
            entities = list(entities_res.scalars().all())

        rels_res = await db.execute(select(Relationship))
        rels = list(rels_res.scalars().all())

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
            "why_it_matters": f"{entity.name} directly influences market share and enterprise AI adoption. Recent strategic pivots could disrupt pricing dynamics and vendor evaluation cycles.",
            "related_entities": related,
            "timeline": timeline,
            "predictions": predictions,
            "simulations": simulations,
            "evidence": [
                {
                    "source": entity.domain or "web-intelligence",
                    "claim": f"Historical pricing patterns and model updates for {entity.name}",
                    "confidence": 92
                }
            ],
            "actions": actions
        }

    @staticmethod
    async def seed_initial_world(db: AsyncSession):
        """
        Seeds real-world AI ecosystem entities and strategic relationships.
        """
        # Center Node: Anthropic (Primary Focus Company)
        anthropic = await WorldModelService.get_or_create_entity(
            db, "Anthropic", entity_type="company", domain="anthropic.com",
            description="Frontier AI research lab and creator of the Claude 3.5 & 3.7 model family.", importance=100
        )
        
        openai = await WorldModelService.get_or_create_entity(
            db, "OpenAI", entity_type="competitor", domain="openai.com",
            description="Leading frontier AI provider across GPT-4o, o3-mini, and enterprise API platforms.", importance=95
        )

        deepmind = await WorldModelService.get_or_create_entity(
            db, "Google DeepMind", entity_type="competitor", domain="deepmind.google",
            description="Alphabet AI research lab deploying Gemini multimodal and real-time reasoning models.", importance=92
        )

        aws = await WorldModelService.get_or_create_entity(
            db, "AWS Bedrock", entity_type="vendor", domain="aws.amazon.com",
            description="Primary hyperscaler model hosting and cloud infrastructure distribution partner.", importance=88
        )

        mistral = await WorldModelService.get_or_create_entity(
            db, "Mistral AI", entity_type="technology", domain="mistral.ai",
            description="European open-weights and commercial enterprise reasoning model provider.", importance=80
        )

        eu_reg = await WorldModelService.get_or_create_entity(
            db, "EU AI Office", entity_type="regulator", domain="digital-strategy.ec.europa.eu",
            description="European Commission regulatory body enforcing GPAI systemic risk conformity under the EU AI Act.", importance=90
        )

        enterprise_clients = await WorldModelService.get_or_create_entity(
            db, "Enterprise Market", entity_type="marketplace", domain="fortune500.com",
            description="Tier 1 Global 2000 procurement accounts evaluating secure agent deployment.", importance=86
        )

        # Connect initial relationships
        await WorldModelService.update_relationship(
            db, openai.id, anthropic.id, "competes_with", confidence=98, current_val="Frontier Model API Price War (-50%)"
        )
        await WorldModelService.update_relationship(
            db, anthropic.id, aws.id, "depends_on", confidence=95, current_val="Strategic Cloud & Bedrock Compute Distribution"
        )
        await WorldModelService.update_relationship(
            db, deepmind.id, openai.id, "competes_with", confidence=94, current_val="Multimodal Reasoning Race (Gemini vs GPT-4o)"
        )
        await WorldModelService.update_relationship(
            db, anthropic.id, eu_reg.id, "targets", confidence=90, current_val="Article 50 & 52 Model Provenance Compliance"
        )
        await WorldModelService.update_relationship(
            db, anthropic.id, enterprise_clients.id, "sells", confidence=94, current_val="Enterprise Claude Workspace & Batch APIs"
        )
        await WorldModelService.update_relationship(
            db, openai.id, enterprise_clients.id, "targets", confidence=95, current_val="ChatGPT Enterprise & Custom GPTs"
        )
        await WorldModelService.update_relationship(
            db, mistral.id, enterprise_clients.id, "sells", confidence=82, current_val="On-Premise & Sovereign Cloud Deployments"
        )

world_model_service = WorldModelService()
