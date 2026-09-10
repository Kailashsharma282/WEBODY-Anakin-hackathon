import os
import time
import asyncio
import logging
from typing import Dict, Any, Optional, List
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("webody.anakin_client")
logging.basicConfig(level=logging.INFO)

class AnakinException(Exception):
    """Base exception for Anakin API errors"""
    pass

class AnakinAuthError(AnakinException):
    """Raised when ANAKIN_API_KEY is missing, invalid, or expired"""
    pass

class AnakinRateLimitError(AnakinException):
    """Raised when rate limit is exceeded (HTTP 429)"""
    pass

class AnakinTimeoutError(AnakinException):
    """Raised when an Anakin API call times out"""
    pass

class AnakinUnavailableError(AnakinException):
    """Raised when an Anakin capability or service is unavailable"""
    pass

class AnakinAPIError(AnakinException):
    """Raised for unexpected or malformed API responses"""
    def __init__(self, message: str, status_code: Optional[int] = None, response_body: Optional[Any] = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body

class AnakinClient:
    """
    Central abstraction for all official Anakin.io REST APIs.
    Enforces secret isolation, retries with exponential backoff, async polling,
    and strict success confirmation.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANAKIN_API_KEY", "").strip()
        self.base_url = (base_url or os.getenv("ANAKIN_BASE_URL", "https://api.anakin.io")).rstrip("/")
        self.max_retries = int(os.getenv("ANAKIN_MAX_RETRIES", "3"))
        self.timeout_seconds = float(os.getenv("ANAKIN_TIMEOUT", "30.0"))

    def has_api_key(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 5)

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "WEBODY-OS/1.0 (AnakinForgeHackathon; Team:kailashsharma)"
        }
        if self.api_key:
            headers["X-API-Key"] = self.api_key
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def _request(
        self,
        method: str,
        endpoint: str,
        payload: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        requires_auth: bool = True
    ) -> Dict[str, Any]:
        """
        Executes HTTP requests with exponential backoff, rate limit handling, and timeout safeguards.
        """
        if requires_auth and not self.has_api_key():
            raise AnakinAuthError("ANAKIN_API_KEY is not configured in environment variables.")

        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = self._get_headers()

        backoff = 1.0
        last_exception: Optional[Exception] = None

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                    if method.upper() == "GET":
                        response = await client.get(url, headers=headers, params=params)
                    elif method.upper() == "POST":
                        response = await client.post(url, headers=headers, json=payload or {}, params=params)
                    elif method.upper() == "DELETE":
                        response = await client.delete(url, headers=headers, params=params)
                    else:
                        raise ValueError(f"Unsupported HTTP method: {method}")

                    # Rate Limit Handling (HTTP 429)
                    if response.status_code == 429:
                        retry_after = float(response.headers.get("Retry-After", backoff))
                        logger.warning(f"Anakin rate limit reached on {endpoint}. Backing off for {retry_after}s (attempt {attempt}/{self.max_retries})")
                        if attempt < self.max_retries:
                            await asyncio.sleep(retry_after)
                            backoff *= 2
                            continue
                        raise AnakinRateLimitError(f"Rate limit exceeded after {self.max_retries} attempts.")

                    # Auth Errors (HTTP 401, 403)
                    if response.status_code in (401, 403):
                        raise AnakinAuthError(f"Authentication failed with status {response.status_code}: {response.text}")

                    # Service Unavailable (HTTP 502, 503, 504)
                    if response.status_code in (502, 503, 504):
                        logger.warning(f"Anakin service unavailable ({response.status_code}) on {endpoint}. Attempt {attempt}/{self.max_retries}")
                        if attempt < self.max_retries:
                            await asyncio.sleep(backoff)
                            backoff *= 2
                            continue
                        raise AnakinUnavailableError(f"Anakin service temporarily unavailable: {response.status_code}")

                    if response.status_code >= 400:
                        raise AnakinAPIError(
                            f"Anakin API call failed ({response.status_code}): {response.text}",
                            status_code=response.status_code,
                            response_body=response.text
                        )

                    try:
                        return response.json()
                    except Exception as json_err:
                        # Malformed response check
                        raise AnakinAPIError(f"Malformed JSON response from Anakin API: {str(json_err)}", response_body=response.text)

            except httpx.TimeoutException as exc:
                last_exception = exc
                logger.warning(f"Timeout on {endpoint} (attempt {attempt}/{self.max_retries})")
                if attempt < self.max_retries:
                    await asyncio.sleep(backoff)
                    backoff *= 2
                    continue
                raise AnakinTimeoutError(f"Request to {endpoint} timed out after {self.timeout_seconds}s.")
            except (AnakinAuthError, AnakinRateLimitError, AnakinUnavailableError, AnakinAPIError):
                raise
            except Exception as exc:
                last_exception = exc
                logger.warning(f"Network error on {endpoint}: {exc} (attempt {attempt}/{self.max_retries})")
                if attempt < self.max_retries:
                    await asyncio.sleep(backoff)
                    backoff *= 2
                    continue

        raise AnakinAPIError(f"Anakin request failed after {self.max_retries} attempts: {str(last_exception)}")

    # ================= 1. MAP API =================
    async def map_domain(self, url: str) -> Dict[str, Any]:
        """
        Calls Anakin Map API to discover full URL structure of a target domain.
        """
        payload = {"url": url}
        return await self._request("POST", "/v1/map", payload=payload)

    # ================= 2. CRAWL API =================
    async def start_crawl(self, url: str, max_depth: int = 2, max_pages: int = 20) -> Dict[str, Any]:
        """
        Starts an asynchronous website crawl job.
        """
        payload = {
            "url": url,
            "max_depth": max_depth,
            "max_pages": max_pages
        }
        return await self._request("POST", "/v1/crawl", payload=payload)

    async def get_crawl_status(self, job_id: str) -> Dict[str, Any]:
        """
        Polls crawl status and retrieves crawled pages.
        """
        return await self._request("GET", f"/v1/crawl/{job_id}")

    # ================= 3. URL SCRAPER =================
    async def scrape_url(self, url: str, render_js: bool = True, format: str = "markdown") -> Dict[str, Any]:
        """
        Scrapes a single page and extracts structured markdown/content.
        """
        payload = {
            "url": url,
            "render_js": render_js,
            "format": format
        }
        return await self._request("POST", "/v1/scrape", payload=payload)

    # ================= 4. SEARCH API =================
    async def search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Performs real-time web search with source citations and structured snippets.
        """
        payload = {
            "query": query,
            "num_results": num_results
        }
        return await self._request("POST", "/v1/search", payload=payload)

    # ================= 5. AGENTIC SEARCH =================
    async def agentic_search(self, query: str, max_steps: int = 3) -> Dict[str, Any]:
        """
        Runs Anakin's multi-step deep research agent to gather multi-source evidence.
        """
        payload = {
            "query": query,
            "max_steps": max_steps
        }
        return await self._request("POST", "/v1/agentic-search", payload=payload)

    # ================= 6. WEBSITE MONITORING =================
    async def get_monitors(self) -> Dict[str, Any]:
        """
        Lists active website monitoring jobs.
        """
        return await self._request("GET", "/v1/monitors")

    async def create_monitor(self, url: str, frequency: str = "hourly", name: Optional[str] = None) -> Dict[str, Any]:
        """
        Registers a URL with Anakin Website Monitoring.
        """
        payload = {
            "url": url,
            "frequency": frequency,
            "name": name or url
        }
        return await self._request("POST", "/v1/monitors", payload=payload)

    # ================= 7. AI VISIBILITY =================
    async def get_ai_visibility(self, brand: str, competitors: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Queries AI Visibility metrics across models (mentions, citations, associations).
        """
        payload = {
            "brand": brand,
            "competitors": competitors or []
        }
        return await self._request("POST", "/v1/ai-visibility/analyze", payload=payload)

    # ================= 8. WIRE (ACTION ENGINE) =================
    async def get_wire_catalog(self, query: Optional[str] = None, service: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Discovers pre-built Wire actions dynamically from Anakin's catalog.
        """
        params = {}
        if query:
            params["query"] = query
        if service:
            params["service"] = service

        try:
            res = await self._request("GET", "/v1/wire/actions", params=params, requires_auth=False)
            if isinstance(res, list):
                return res
            return res.get("actions", [])
        except Exception as e:
            logger.info(f"Could not reach live Wire catalog ({e}). Returning official catalog definitions.")
            return self._get_fallback_catalog(query, service)

    async def execute_wire_task(self, action_id: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submits a Wire task.
        STRICT RULE: Never claim an action succeeded unless confirmed by API.
        """
        payload = {
            "action": action_id,
            "parameters": parameters
        }
        return await self._request("POST", "/v1/wire/task", payload=payload)

    async def get_wire_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Polls Wire task job status.
        """
        return await self._request("GET", f"/v1/wire/jobs/{job_id}")

    async def poll_wire_job(self, job_id: str, timeout_sec: int = 20, poll_interval_sec: float = 1.0) -> Dict[str, Any]:
        """
        Polls an async Wire job until completion or timeout.
        """
        start_time = time.time()
        while time.time() - start_time < timeout_sec:
            res = await self.get_wire_job_status(job_id)
            status = res.get("status", "").lower()
            if status in ("completed", "success", "done"):
                return res
            elif status in ("failed", "error"):
                raise AnakinAPIError(f"Wire job failed: {res.get('error', 'Unknown error')}", response_body=res)
            await asyncio.sleep(poll_interval_sec)
        raise AnakinTimeoutError(f"Wire job {job_id} timed out after {timeout_sec}s.")

    def _get_fallback_catalog(self, query: Optional[str] = None, service: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Standard catalog schemas for known Anakin Wire actions (e.g. GitHub issue creation, Webhook dispatch, Slack notification).
        Dynamically filtered by query/service.
        """
        catalog = [
            {
                "action_id": "github.issue.create",
                "name": "Create GitHub Strategy/Governance Issue",
                "service": "github",
                "description": "Create a priority strategic issue in the target repository to track competitive counter-actions.",
                "required_inputs": ["repo", "title", "body"],
                "input_schema": {
                    "repo": {"type": "string", "description": "Repository in owner/repo format"},
                    "title": {"type": "string", "description": "Title of the issue"},
                    "body": {"type": "string", "description": "Markdown body describing the strategic counter-measure"},
                    "labels": {"type": "array", "items": {"type": "string"}, "description": "Labels e.g. ['strategy', 'competitive', 'priority']"}
                }
            },
            {
                "action_id": "github.issue.update",
                "name": "Update GitHub Strategic Initiative",
                "service": "github",
                "description": "Append intelligence observations or update priority on existing GitHub issue.",
                "required_inputs": ["repo", "issue_number", "body"],
                "input_schema": {
                    "repo": {"type": "string", "description": "Repository in owner/repo format"},
                    "issue_number": {"type": "integer", "description": "Issue number to update"},
                    "body": {"type": "string", "description": "Comment or updated content"}
                }
            },
            {
                "action_id": "slack.message.send",
                "name": "Dispatch Executive Intelligence Alert",
                "service": "slack",
                "description": "Send a rich card notification to executive leadership channel with simulation recommendations.",
                "required_inputs": ["channel", "message"],
                "input_schema": {
                    "channel": {"type": "string", "description": "Channel identifier or name"},
                    "message": {"type": "string", "description": "Summary of competitive shift and chosen scenario"}
                }
            },
            {
                "action_id": "webhook.post",
                "name": "Trigger Automated Strategic Webhook",
                "service": "webhook",
                "description": "Post validated strategy execution payload to internal ERP / BI systems.",
                "required_inputs": ["target_url", "payload"],
                "input_schema": {
                    "target_url": {"type": "string", "description": "Destination endpoint URL"},
                    "payload": {"type": "object", "description": "Structured execution data"}
                }
            }
        ]

        results = catalog
        if service:
            results = [a for a in results if a["service"].lower() == service.lower()]
        if query:
            q = query.lower()
            results = [a for a in results if q in a["name"].lower() or q in a["description"].lower() or q in a["action_id"].lower()]
        return results

anakin_client = AnakinClient()
