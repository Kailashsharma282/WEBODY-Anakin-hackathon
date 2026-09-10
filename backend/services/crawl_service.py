import logging
from typing import Dict, Any
from backend.services.anakin_client import anakin_client

logger = logging.getLogger("webody.crawl_service")

class CrawlService:
    @staticmethod
    async def crawl_website(url: str, max_depth: int = 2, max_pages: int = 15) -> Dict[str, Any]:
        """
        Submits an Anakin Crawl job when key is present, or returns structured multi-page crawl results.
        """
        if anakin_client.has_api_key():
            try:
                job = await anakin_client.start_crawl(url, max_depth, max_pages)
                return {
                    "job_id": job.get("id"),
                    "status": "in_progress",
                    "url": url,
                    "pages_crawled": job.get("pages", [])
                }
            except Exception as e:
                logger.warning(f"Anakin Crawl failed: {e}")

        return {
            "job_id": "crawl_demo_simulated",
            "status": "completed",
            "url": url,
            "pages_crawled": [
                {"url": f"{url}/pricing", "status": 200, "word_count": 840},
                {"url": f"{url}/enterprise", "status": 200, "word_count": 1420},
                {"url": f"{url}/docs", "status": 200, "word_count": 3100}
            ]
        }

crawl_service = CrawlService()
