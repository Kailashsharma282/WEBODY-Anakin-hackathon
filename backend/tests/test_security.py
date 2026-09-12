import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.security_service import ssrf_guard, SecurityValidationError, SlidingWindowRateLimiter, mask_secret

client = TestClient(app)

def test_ssrf_guard_blocks_dangerous_ips():
    # 1. Localhost and loopback
    with pytest.raises(SecurityValidationError) as exc:
        ssrf_guard.validate_url("http://127.0.0.1:8000/admin")
    assert "SSRF" in str(exc.value) or "restricted" in str(exc.value) or "prohibited" in str(exc.value)

    with pytest.raises(SecurityValidationError):
        ssrf_guard.validate_url("http://localhost:3000")

    # 2. Cloud metadata IP
    with pytest.raises(SecurityValidationError):
        ssrf_guard.validate_url("http://169.254.169.254/latest/meta-data/")

    # 3. Private RFC1918 Class A/B/C
    with pytest.raises(SecurityValidationError):
        ssrf_guard.validate_url("http://10.0.0.1/internal-dashboard")

    with pytest.raises(SecurityValidationError):
        ssrf_guard.validate_url("http://192.168.1.100:8080")

    # 4. Invalid protocols
    with pytest.raises(SecurityValidationError):
        ssrf_guard.validate_url("file:///etc/passwd")

    with pytest.raises(SecurityValidationError):
        ssrf_guard.validate_url("gopher://evil.com")

def test_ssrf_guard_allows_valid_public_targets():
    # Public domains
    assert ssrf_guard.validate_url("https://openai.com") == "https://openai.com"
    assert ssrf_guard.validate_url("https://stripe.com/pricing") == "https://stripe.com/pricing"
    assert ssrf_guard.validate_domain("anthropic.com") == "anthropic.com"
    assert ssrf_guard.validate_domain("https://docs.anakin.io/reference") == "docs.anakin.io"

def test_sliding_window_rate_limiter():
    limiter = SlidingWindowRateLimiter(limit_per_minute=5)
    ip = "203.0.113.195"

    # First 5 should succeed
    for _ in range(5):
        allowed, remaining, retry = limiter.check_rate_limit(ip)
        assert allowed is True

    # 6th should be blocked
    allowed, remaining, retry = limiter.check_rate_limit(ip)
    assert allowed is False
    assert remaining == 0
    assert retry >= 1

def test_secret_masking():
    assert mask_secret(None) == "NOT_CONFIGURED"
    assert mask_secret("short") == "****"
    masked = mask_secret("anakin_live_super_secret_key_12345")
    assert masked.startswith("anak...")
    assert masked.endswith("2345")
    assert "super_secret" not in masked

def test_security_headers_present():
    resp = client.get("/health")
    assert resp.status_code == 200
    headers = resp.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "SAMEORIGIN"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert "strict-origin" in headers.get("referrer-policy", "")
