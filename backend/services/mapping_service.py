import re
import logging
from typing import List, Dict, Any
from urllib.parse import urlparse
from backend.services.anakin_client import anakin_client

logger = logging.getLogger("webody.mapping_service")

VALID_CATEGORIES = [
    "PRODUCT", "PRICING", "TECHNOLOGY", "DOCUMENTATION", "COMPANY",
    "CAREERS", "SECURITY", "BLOG", "PRESS", "CUSTOMERS",
    "PARTNERS", "INTEGRATIONS", "LEGAL", "OTHER"
]

def classify_url(url: str) -> str:
    """
    Semantically classifies a URL into one of the canonical Cartographer categories:
    PRODUCT, PRICING, TECHNOLOGY, DOCUMENTATION, COMPANY, CAREERS, SECURITY,
    BLOG, PRESS, CUSTOMERS, PARTNERS, INTEGRATIONS, LEGAL, OTHER.
    """
    path = urlparse(url).path.lower()

    if any(k in path for k in ["/price", "/pricing", "/plans", "/tiers", "/billing", "/costs"]):
        return "PRICING"
    if any(k in path for k in ["/docs", "/doc", "/documentation", "/api", "/guides", "/reference", "/developers"]):
        return "DOCUMENTATION"
    if any(k in path for k in ["/careers", "/jobs", "/hiring", "/work-with-us", "/join"]):
        return "CAREERS"
    if any(k in path for k in ["/security", "/compliance", "/trust", "/soc2", "/iso", "/privacy-security"]):
        return "SECURITY"
    if any(k in path for k in ["/blog", "/news", "/posts", "/articles", "/insights"]):
        return "BLOG"
    if any(k in path for k in ["/press", "/media", "/announcements", "/releases"]):
        return "PRESS"
    if any(k in path for k in ["/customers", "/case-studies", "/stories", "/testimonials"]):
        return "CUSTOMERS"
    if any(k in path for k in ["/partners", "/affiliates", "/resellers"]):
        return "PARTNERS"
    if any(k in path for k in ["/integrations", "/marketplace", "/apps", "/plugins"]):
        return "INTEGRATIONS"
    if any(k in path for k in ["/terms", "/privacy", "/legal", "/dpa", "/gdpr"]):
        return "LEGAL"
    if any(k in path for k in ["/tech", "/architecture", "/engineering", "/platform", "/infrastructure"]):
        return "TECHNOLOGY"
    if any(k in path for k in ["/product", "/features", "/solutions", "/tour", "/overview"]):
        return "PRODUCT"
    if any(k in path for k in ["/about", "/company", "/team", "/leadership", "/contact"]):
        return "COMPANY"

    return "OTHER"

def extract_entities_from_url(url: str) -> List[str]:
    """
    Extracts relevant entity names from a URL domain and path.
    """
    parsed = urlparse(url)
    domain_part = parsed.netloc.split(":")[0]
    subparts = domain_part.split(".")
    domain_name = subparts[0].capitalize() if subparts else "Unknown"
    entities = [domain_name]

    path_segments = [s.strip() for s in parsed.path.split("/") if s.strip()]
    for segment in path_segments:
        if segment.lower() in ("aws", "slack", "github", "google", "microsoft", "openai"):
            entities.append(segment.upper() if len(segment) <= 4 else segment.capitalize())
    return entities

class MappingService:
    @staticmethod
    async def map_target_domain(domain_or_url: str, max_pages: int = 25) -> Dict[str, Any]:
        """
        Cartographer engine: calls Anakin Map API when available,
        extracts URLs, classifies them semantically, and builds topology.
        """
        if not domain_or_url.startswith("http"):
            url = f"https://{domain_or_url}"
            clean_domain = domain_or_url
        else:
            url = domain_or_url
            clean_domain = urlparse(domain_or_url).netloc

        live_anakin_used = False
        discovered_urls = []

        if anakin_client.has_api_key():
            try:
                res = await anakin_client.map_domain(url)
                urls = res.get("urls", [])
                if urls:
                    discovered_urls = urls[:max_pages]
                    live_anakin_used = True
            except Exception as e:
                logger.warning(f"Anakin Map live call failed ({e}). Generating domain topology.")

        if not discovered_urls:
            # Deterministic topological structure for domain
            routes = [
                "", "/pricing", "/enterprise-pricing", "/features", "/docs", "/docs/api-reference",
                "/docs/governance", "/security", "/compliance", "/careers", "/jobs/lead-architect",
                "/blog", "/blog/announcing-ai-guardrails", "/customers", "/integrations", "/legal/privacy"
            ]
            discovered_urls = [f"https://{clean_domain}{r}" for r in routes]

        pages = []
        category_counts = {cat: 0 for cat in VALID_CATEGORIES}

        for u in discovered_urls:
            cat = classify_url(u)
            category_counts[cat] += 1
            # Infer importance based on category
            importance = 90 if cat in ("PRICING", "SECURITY", "PRODUCT") else 70 if cat in ("DOCUMENTATION", "CAREERS") else 40
            
            # Simple title generation from slug
            slug = urlparse(u).path.strip("/").replace("-", " ").title() or f"{clean_domain} Home"
            
            pages.append({
                "url": u,
                "page_category": cat,
                "title": slug,
                "status": "mapped",
                "summary": f"Classified {cat} node for {clean_domain}",
                "importance": importance,
                "extracted_entities": [clean_domain, cat.lower()]
            })

        return {
            "domain": clean_domain,
            "total_discovered": len(pages),
            "categories": category_counts,
            "pages": pages,
            "live_anakin_used": live_anakin_used
        }

mapping_service = MappingService()
