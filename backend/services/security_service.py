import ipaddress
import logging
import socket
import time
from collections import defaultdict
from typing import Optional, Set
from urllib.parse import urlparse
from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("webody.security")

# Blocked IP networks for SSRF protection (RFC 1918, RFC 3927, loopback, link-local, broadcast)
BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("10.0.0.0/8"),        # Private Class A
    ipaddress.ip_network("172.16.0.0/12"),     # Private Class B
    ipaddress.ip_network("192.168.0.0/16"),    # Private Class C
    ipaddress.ip_network("169.254.0.0/16"),    # Cloud Metadata / Link-local
    ipaddress.ip_network("0.0.0.0/8"),         # Broadcast/Current network
    ipaddress.ip_network("224.0.0.0/4"),       # Multicast
    ipaddress.ip_network("240.0.0.0/4"),       # Reserved
    ipaddress.ip_network("::1/128"),           # IPv6 Loopback
    ipaddress.ip_network("fc00::/7"),          # IPv6 Unique Local
    ipaddress.ip_network("fe80::/10"),         # IPv6 Link-local
]

class SecurityValidationError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)

class SSRFGuard:
    """
    Prevents Server-Side Request Forgery (SSRF) attacks by validating target domains
    and URLs before they are passed to web crawlers, scrapers, or network clients.
    """

    @staticmethod
    def is_private_or_reserved_ip(ip_str: str) -> bool:
        try:
            ip = ipaddress.ip_address(ip_str)
            return any(ip in net for net in BLOCKED_NETWORKS)
        except ValueError:
            return True

    @staticmethod
    def validate_url(url: str, allow_private: bool = False) -> str:
        """
        Validates that a URL is safe to fetch:
        - Scheme must be http or https
        - Hostname must resolve to a valid non-private IP (unless allow_private=True for testing)
        - Prevents access to localhost, cloud metadata services (169.254.169.254), and internal LANs
        """
        if not url or not isinstance(url, str):
            raise SecurityValidationError("Invalid URL: must be a non-empty string.")

        parsed = urlparse(url.strip())
        if parsed.scheme not in ("http", "https"):
            raise SecurityValidationError(f"Invalid URL scheme '{parsed.scheme}'. Only http and https are permitted.")

        hostname = parsed.hostname
        if not hostname:
            raise SecurityValidationError("Invalid URL: missing valid hostname.")

        # Check explicit forbidden hostnames
        forbidden_hosts = {"localhost", "127.0.0.1", "::1", "metadata.google.internal", "instance-data"}
        if hostname.lower() in forbidden_hosts:
            if not allow_private:
                raise SecurityValidationError(f"Access to internal host '{hostname}' is strictly prohibited by SSRF guard.")

        # Resolve hostname to IP address and verify it is not in private/reserved blocks
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            resolved_ips = {item[4][0] for item in addr_info}
            for ip in resolved_ips:
                if SSRFGuard.is_private_or_reserved_ip(ip) and not allow_private:
                    logger.warning(f"[SSRF GUARD BLOCKED] Target hostname '{hostname}' resolves to restricted IP '{ip}'")
                    raise SecurityValidationError(f"Target host '{hostname}' resolves to a restricted internal network address.")
        except socket.gaierror as e:
            # If domain cannot be resolved at all, let standard network client handle DNS resolution or fail gracefully
            logger.debug(f"DNS resolution check deferred for {hostname}: {e}")

        return url.strip()

    @staticmethod
    def validate_domain(domain: str, allow_private: bool = False) -> str:
        """
        Sanitizes and validates a target domain string for mapping/crawling.
        """
        if not domain or not isinstance(domain, str):
            raise SecurityValidationError("Invalid domain: must be a non-empty string.")

        clean = domain.strip().lower()
        # Strip protocols and paths if mistakenly passed
        if clean.startswith("https://"):
            clean = clean[8:]
        elif clean.startswith("http://"):
            clean = clean[7:]
        clean = clean.split("/")[0].split(":")[0]

        if not clean or "." not in clean and clean != "localhost":
            raise SecurityValidationError(f"Invalid domain format: '{domain}'")

        if clean in {"localhost", "127.0.0.1", "::1"} and not allow_private:
            raise SecurityValidationError("Localhost mapping is forbidden for security.")

        return clean


class SlidingWindowRateLimiter:
    """
    In-memory sliding window rate limiter.
    Limits requests per client IP to safeguard API resources while supporting
    high concurrency for legitimate operations.
    """
    def __init__(self, limit_per_minute: int = 180):
        self.limit = limit_per_minute
        self.window_seconds = 60.0
        self.requests = defaultdict(list)

    def check_rate_limit(self, client_ip: str) -> tuple[bool, int, int]:
        """
        Returns (is_allowed, remaining_requests, retry_after_seconds)
        """
        now = time.time()
        window_start = now - self.window_seconds
        
        # Prune old timestamps
        history = self.requests[client_ip]
        self.requests[client_ip] = [t for t in history if t > window_start]
        current_count = len(self.requests[client_ip])

        if current_count >= self.limit:
            oldest = self.requests[client_ip][0]
            retry_after = int(oldest + self.window_seconds - now) + 1
            return False, 0, max(1, retry_after)

        self.requests[client_ip].append(now)
        remaining = self.limit - (current_count + 1)
        return True, remaining, 0


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Appends hardened HTTP security headers to all incoming API responses.
    Defends against clickjacking, MIME-type sniffing, cross-site scripting,
    and information disclosure.
    """
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        
        # Hardened Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response


def mask_secret(secret: Optional[str]) -> str:
    """
    Masks sensitive secrets for safe display in logs and telemetry.
    e.g. 'anakin_live_99882233aabbcc' -> 'anak...bbcc'
    """
    if not secret:
        return "NOT_CONFIGURED"
    if len(secret) <= 8:
        return "****"
    return f"{secret[:4]}...{secret[-4:]}"


ssrf_guard = SSRFGuard()
rate_limiter = SlidingWindowRateLimiter(limit_per_minute=180)
