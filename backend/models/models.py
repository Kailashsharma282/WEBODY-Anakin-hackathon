import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class Entity(Base):
    __tablename__ = "entities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    entity_type = Column(String(100), nullable=False) # company, product, person, technology, website, etc.
    domain = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(100), default="active")
    importance = Column(Integer, default=50) # 0-100
    meta_data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    out_relationships = relationship("Relationship", foreign_keys="Relationship.source_entity_id", back_populates="source_entity", cascade="all, delete-orphan")
    in_relationships = relationship("Relationship", foreign_keys="Relationship.target_entity_id", back_populates="target_entity", cascade="all, delete-orphan")
    signals = relationship("Signal", back_populates="entity_rel", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="entity", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="entity", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="entity", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="entity", cascade="all, delete-orphan")

class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_entity_id = Column(String(36), ForeignKey("entities.id"), nullable=False)
    target_entity_id = Column(String(36), ForeignKey("entities.id"), nullable=False)
    relationship_type = Column(String(100), nullable=False) # competes_with, owns, sells, integrates_with, depends_on, hires_for, targets, announced, changed, references, replaces, related_to
    confidence = Column(Integer, default=80) # 0-100
    observed_at = Column(DateTime(timezone=True), default=utc_now)
    source = Column(String(255), nullable=True)
    previous_value = Column(Text, nullable=True)
    current_value = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    source_entity = relationship("Entity", foreign_keys=[source_entity_id], back_populates="out_relationships")
    target_entity = relationship("Entity", foreign_keys=[target_entity_id], back_populates="in_relationships")

class Source(Base):
    __tablename__ = "sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    url = Column(Text, nullable=False)
    title = Column(String(255), nullable=True)
    domain = Column(String(255), nullable=True)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="SET NULL"), nullable=True)
    page_category = Column(String(100), default="OTHER") # PRODUCT, PRICING, TECHNOLOGY, DOCUMENTATION, COMPANY, CAREERS, SECURITY, BLOG, PRESS, CUSTOMERS, PARTNERS, INTEGRATIONS, LEGAL, OTHER
    status = Column(String(100), default="discovered")
    summary = Column(Text, nullable=True)
    extracted_entities = Column(JSON, default=list)
    last_crawled = Column(DateTime(timezone=True), nullable=True)
    importance = Column(Integer, default=50)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class WatchTarget(Base):
    __tablename__ = "watch_targets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    entity_type = Column(String(100), nullable=False) # company, competitor, product, pricing_page, documentation, changelog, github_repository, regulatory_site, status_page, hiring_page, ai_visibility_target, marketplace, arbitrary_url
    url = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    importance = Column(Integer, default=50) # 0-100
    monitoring_frequency = Column(String(100), default="hourly") # realtime, hourly, daily
    enabled = Column(Boolean, default=True)
    last_checked = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class Signal(Base):
    __tablename__ = "signals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=True)
    entity = Column(String(255), nullable=False)
    source = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now)
    event_type = Column(String(100), nullable=False) # price_changes, product_changes, feature_additions, doc_changes, policy_changes, hiring_changes, status_incidents, content_changes, positioning_changes, ai_visibility_changes
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=True)
    importance = Column(Integer, default=50) # 0-100
    severity = Column(String(50), default="medium") # low, medium, high, critical
    confidence = Column(Integer, default=80) # 0-100
    actionability = Column(String(50), default="high") # low, medium, high
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    entity_rel = relationship("Entity", back_populates="signals", foreign_keys=[entity_id])
    investigations = relationship("Investigation", back_populates="signal", cascade="all, delete-orphan")

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    signal_id = Column(String(36), ForeignKey("signals.id", ondelete="CASCADE"), nullable=True)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="completed") # pending, investigating, completed, failed
    event = Column(Text, nullable=False)
    interpretation = Column(Text, nullable=False)
    confidence = Column(Integer, default=85) # 0-100
    importance = Column(Integer, default=90) # 0-100
    strategic_theme = Column(String(255), nullable=False)
    implications = Column(JSON, default=list) # list of strings
    unknowns = Column(JSON, default=list) # list of strings
    created_at = Column(DateTime(timezone=True), default=utc_now)

    signal = relationship("Signal", back_populates="investigations")
    evidence_items = relationship("Evidence", back_populates="investigation", cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    source_url = Column(Text, nullable=False)
    source_title = Column(String(255), nullable=False)
    claim = Column(Text, nullable=False)
    quote = Column(Text, nullable=True)
    confidence = Column(Integer, default=85)
    relevance_score = Column(Integer, default=90)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    investigation = relationship("Investigation", back_populates="evidence_items")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=True)
    signal_id = Column(String(36), ForeignKey("signals.id", ondelete="SET NULL"), nullable=True)
    prediction = Column(Text, nullable=False)
    probability = Column(Integer, default=75) # 0-100
    time_window = Column(String(100), default="30 days")
    confidence = Column(Integer, default=80) # 0-100
    supporting_signals = Column(JSON, default=list) # list of strings
    contradicting_signals = Column(JSON, default=list) # list of strings
    reasoning = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    entity = relationship("Entity", back_populates="predictions")

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=True)
    signal_id = Column(String(36), ForeignKey("signals.id", ondelete="SET NULL"), nullable=True)
    prediction_id = Column(String(36), ForeignKey("predictions.id", ondelete="SET NULL"), nullable=True)
    scenario = Column(String(255), nullable=False) # e.g. "Scenario A: DO NOTHING", "Scenario C: DIFFERENTIATE"
    score = Column(Integer, default=70) # 0-100
    risk = Column(Integer, default=30) # 0-100
    benefit = Column(Integer, default=80) # 0-100
    complexity = Column(Integer, default=40) # 0-100
    reasoning = Column(Text, nullable=False)
    recommended = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    entity = relationship("Entity", back_populates="scenarios")

class Action(Base):
    __tablename__ = "actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="SET NULL"), nullable=True)
    signal_id = Column(String(36), ForeignKey("signals.id", ondelete="SET NULL"), nullable=True)
    scenario_id = Column(String(36), ForeignKey("scenarios.id", ondelete="SET NULL"), nullable=True)
    action_id = Column(String(255), nullable=False) # e.g., github.issue.create, anakin.wire.task
    action_type = Column(String(100), default="wire_task")
    name = Column(String(255), nullable=False)
    schema_json = Column(JSON, default=dict)
    payload = Column(JSON, default=dict)
    status = Column(String(50), default="discovered") # discovered, validated, submitted, running, completed, failed
    approval_required = Column(Boolean, default=True)
    approved = Column(Boolean, default=False)
    execution_result = Column(JSON, nullable=True)
    external_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    entity = relationship("Entity", back_populates="actions")

class TimelineEvent(Base):
    __tablename__ = "timelines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source = Column(String(255), nullable=False)
    event_type = Column(String(100), nullable=False)
    confidence = Column(Integer, default=80)
    impact = Column(String(50), default="medium") # low, medium, high, critical
    created_at = Column(DateTime(timezone=True), default=utc_now)

    entity = relationship("Entity", back_populates="timeline_events")

class AIVisibilityObservation(Base):
    __tablename__ = "ai_visibility_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    brand_mentions = Column(Integer, default=0)
    competitor_mentions = Column(Integer, default=0)
    recommendation_patterns = Column(JSON, default=list) # e.g., ["Ranked #1 for enterprise security", "Cited in Gartner review"]
    emerging_associations = Column(JSON, default=list) # e.g., ["AI governance", "SOC2 compliance"]
    citation_patterns = Column(JSON, default=list) # e.g., ["docs.anakin.io", "techcrunch.com"]
    trend_changes = Column(JSON, default=dict) # e.g., {"mentions_delta": "+18%", "sentiment": "bullish"}
    observed_at = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class Setting(Base):
    __tablename__ = "settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
