import logging
from typing import Dict, Any
from backend.services.anakin_client import anakin_client

logger = logging.getLogger("webody.scrape_service")

class ScrapeService:
    @staticmethod
    async def scrape_page(url: str) -> Dict[str, Any]:
        """
        Uses Anakin URL Scraper to extract clean structured markdown and page metadata.
        """
        if anakin_client.has_api_key():
            try:
                res = await anakin_client.scrape_url(url, render_js=True)
                return {
                    "url": url,
                    "content": res.get("content", ""),
                    "markdown": res.get("markdown", ""),
                    "title": res.get("title", "Extracted Document"),
                    "live": True
                }
            except Exception as e:
                logger.warning(f"Anakin Scrape error: {e}")

        return {
            "url": url,
            "content": f"Simulated structured extraction for {url}. Found pricing table with Enterprise Tier updated to $7,800/mo (was $10,000/mo -22% decrease) and AI Governance audit log add-on.",
            "markdown": f"# Enterprise Pricing & Governance\n- Dedicated cluster: Included\n- AI Governance Engine: Now bundled free for enterprise customers.",
            "title": "Pricing & Packaging Update",
            "live": False
        }

scrape_service = ScrapeService()
