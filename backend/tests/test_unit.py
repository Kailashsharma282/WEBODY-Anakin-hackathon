import pytest
from backend.services.mapping_service import classify_url, extract_entities_from_url
from backend.services.signal_service import calculate_importance, is_noise
from backend.services.wire_service import WireService
from backend.schemas.schemas import EvidenceItem, PredictionResponse, ScenarioResponse

def test_url_classification():
    assert classify_url("https://competitorx.ai/pricing") == "PRICING"
    assert classify_url("https://competitorx.ai/enterprise-pricing/tiers") == "PRICING"
    assert classify_url("https://competitorx.ai/docs/governance") == "DOCUMENTATION"
    assert classify_url("https://competitorx.ai/careers/security-engineer") == "CAREERS"
    assert classify_url("https://competitorx.ai/security/soc2") == "SECURITY"
    assert classify_url("https://competitorx.ai/blog/announcements") == "BLOG"
    assert classify_url("https://competitorx.ai/press/series-b") == "PRESS"
    assert classify_url("https://competitorx.ai/legal/privacy-policy") == "LEGAL"
    assert classify_url("https://competitorx.ai/customers/success-stories") == "CUSTOMERS"
    assert classify_url("https://competitorx.ai/integrations/slack") == "INTEGRATIONS"
    assert classify_url("https://competitorx.ai/random-page") == "OTHER"

def test_entity_extraction():
    entities = extract_entities_from_url("https://competitorx.ai/integrations/aws")
    assert "Competitorx" in entities
    assert "AWS" in entities

    empty_entities = extract_entities_from_url("https://example.com/about")
    assert "Example" in empty_entities

def test_signal_importance_calculation():
    # Price changes with enterprise and discounts should score high
    price_score = calculate_importance("price_changes", "Competitor reduced enterprise pricing by 22% with governance bundle.")
    assert price_score >= 90

    # Routine content changes score lower
    content_score = calculate_importance("content_changes", "Updated footer link.")
    assert content_score < 70

def test_noise_suppression():
    # Trivial cookie banner noise must be suppressed
    assert is_noise("Cookie update", "Updated cookie policy banner and tracking pixel.") is True
    # Genuine competitive event must NOT be suppressed
    assert is_noise("Competitor X Enterprise Update", "Enterprise tier pricing slashed by 22%.") is False

def test_evidence_validation():
    ev = EvidenceItem(
        id="ev-001",
        source_url="https://competitorx.ai/pricing",
        source_title="Competitor X Official Pricing",
        claim="Enterprise tier discounted 22%",
        quote="Save 22% on enterprise annual plans.",
        confidence=95,
        relevance_score=98
    )
    assert ev.confidence >= 0 and ev.confidence <= 100
    assert ev.relevance_score >= 0 and ev.relevance_score <= 100
    assert ev.source_url.startswith("https://")
    assert len(ev.claim) > 0

def test_prediction_validation():
    pred = PredictionResponse(
        id="pred-001",
        entity_id="entity-x",
        prediction="Competitor X will announce GovCloud certification within 30 days.",
        probability=85,
        time_window="30 days",
        confidence=88,
        supporting_signals=["Hiring GovCloud Lead", "Updated compliance docs"],
        contradicting_signals=["No public FedRAMP listing yet"],
        reasoning="Aggressive hiring pattern in Q2 aligns with regulatory shift.",
        created_at="2026-09-10T12:00:00Z"
    )
    assert 0 <= pred.probability <= 100
    assert 0 <= pred.confidence <= 100
    assert len(pred.supporting_signals) == 2
    assert "30 days" in pred.time_window

def test_scenario_generation_schema():
    sc = ScenarioResponse(
        id="sc-001",
        scenario="Scenario C: DIFFERENTIATE",
        score=94,
        risk=25,
        benefit=90,
        complexity=35,
        reasoning="Bundle governance suite for free to neutralize price reduction without eroding margins.",
        recommended=True,
        created_at="2026-09-10T12:00:00Z"
    )
    assert 0 <= sc.score <= 100
    assert 0 <= sc.risk <= 100
    assert 0 <= sc.benefit <= 100
    assert 0 <= sc.complexity <= 100
    assert sc.recommended is True

def test_wire_schema_validation():
    sample_schema = {
        "action_id": "github.issue.create",
        "required_inputs": ["repo", "title", "body"]
    }
    valid_payload = {
        "repo": "acme-ai/enterprise-platform",
        "title": "Counter Pricing War",
        "body": "Detailed action plan."
    }
    assert WireService.validate_action_inputs(sample_schema, valid_payload) is True

    # Missing required field must raise ValueError
    invalid_payload = {
        "repo": "acme-ai/enterprise-platform",
        "title": "" # empty
    }
    with pytest.raises(ValueError) as excinfo:
        WireService.validate_action_inputs(sample_schema, invalid_payload)
    assert "Missing required parameter" in str(excinfo.value)
