import os
import time
import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.db.session import init_db, AsyncSessionLocal
from backend.api.routes import api_router
from backend.services.world_model_service import world_model_service
from backend.services.timeline_service import timeline_service
from backend.services.anakin_client import anakin_client
from backend.services.security_service import SecurityHeadersMiddleware, rate_limiter, mask_secret
from sqlalchemy import select
from backend.models.models import Entity

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("webody.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing WEBODY Living Operating System...")
    # Initialize DB tables
    await init_db()
    logger.info("Database schema initialized.")

    # Seed initial world model entities and relationships
    async with AsyncSessionLocal() as db:
        try:
            res = await db.execute(select(Entity))
            existing_entities = res.scalars().all()
            if not existing_entities:
                logger.info("Seeding initial World Model graph (Acme AI, Competitor X, AWS, Regulators)...")
                await world_model_service.seed_initial_world(db)
                
                # Seed historical timeline for Competitor X
                comp_res = await db.execute(select(Entity).where(Entity.name == "Competitor X"))
                comp_x = comp_res.scalars().first()
                if comp_x:
                    await timeline_service.seed_entity_timeline(db, comp_x)
                logger.info("World Model seeded successfully.")
        except Exception as e:
            logger.error(f"Error seeding initial world model: {e}")

    has_key = anakin_client.has_api_key()
    masked = mask_secret(anakin_client.api_key) if has_key else "NONE"
    logger.info(f"Anakin API Key present: {has_key} (Token: {masked})")
    yield
    logger.info("Shutting down WEBODY Living Operating System.")

app = FastAPI(
    title="WEBODY API — The Living Operating System for the Internet",
    description=(
        "Backend ecosystem for the Anakin Forge Hackathon.\n"
        "Participant: Pochiraju Kailash Ram Markandeya Sharma\n"
        "Team: kailashsharma\n"
        "Autonomous loop: OBSERVE -> UNDERSTAND -> PREDICT -> SIMULATE -> ACT -> LEARN"
    ),
    version="1.0.0",
    lifespan=lifespan
)

# 1. Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 2. CORS Configuration
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8008",
        "http://127.0.0.1:8008",
        "*"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Sliding Window Rate Limiting Middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Exempt health checks and websockets from rate limiting
    path = request.url.path
    if path in ("/health", "/api/health", "/docs", "/openapi.json", "/redoc") or path.startswith("/api/ws/"):
        return await call_next(request)

    client_ip = request.client.host if request.client else "127.0.0.1"
    is_allowed, remaining, retry_after = rate_limiter.check_rate_limit(client_ip)
    
    if not is_allowed:
        logger.warning(f"[RATE LIMIT TRIGGERED] IP={client_ip} path={path}")
        return JSONResponse(
            status_code=429,
            content={"detail": "Too Many Requests: Rate limit exceeded. Please throttle API requests."},
            headers={"Retry-After": str(retry_after), "X-RateLimit-Remaining": "0"}
        )

    response: Response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(rate_limiter.limit)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response

# 4. Global Exception Sanitization
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_id = str(uuid.uuid4())[:8]
    logger.error(f"[UNCAUGHT_EXCEPTION] error_id={error_id} path={request.url.path} error={str(exc)}")
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "error_id": error_id}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error_id": error_id}
    )

# 5. Dual Health Check Endpoints (/health and /api/health)
async def generate_health_payload():
    return {
        "status": "healthy",
        "service": "WEBODY Living Operating System",
        "hackathon": "Anakin Forge",
        "participant": "Pochiraju Kailash Ram Markandeya Sharma",
        "team": "kailashsharma",
        "anakin_status": "authenticated" if anakin_client.has_api_key() else "demo_reliability_active",
        "security_layers": ["SSRF_GUARD", "RATE_LIMITER", "SECURITY_HEADERS", "AUDIT_LOGGING"],
        "modules": [
            "SENTINEL", "CARTOGRAPHER", "CORTEX", "ORACLE", "SIMULATOR", "HANDS",
            "WORLD_MODEL", "TIMELINE", "AI_REPUTATION", "ADAPTIVE_GOVERNOR", "VECTOR_MEMORY", "RLHF"
        ]
    }

@app.get("/health")
async def health_check():
    return await generate_health_payload()

@app.get("/api/health")
async def api_health_check():
    return await generate_health_payload()

# Mount all API endpoints
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8008))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)

