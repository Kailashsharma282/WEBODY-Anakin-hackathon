import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.db.session import init_db, AsyncSessionLocal
from backend.api.routes import api_router
from backend.services.world_model_service import world_model_service
from backend.services.timeline_service import timeline_service
from backend.services.anakin_client import anakin_client
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

    logger.info(f"Anakin API Key present: {anakin_client.has_api_key()}")
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

# CORS configuration for local dev and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """
    Health check endpoint per Section 26 and Section 33.
    """
    return {
        "status": "healthy",
        "service": "WEBODY Living Operating System",
        "hackathon": "Anakin Forge",
        "participant": "Pochiraju Kailash Ram Markandeya Sharma",
        "team": "kailashsharma",
        "anakin_status": "authenticated" if anakin_client.has_api_key() else "demo_reliability_active",
        "modules": [
            "SENTINEL", "CARTOGRAPHER", "CORTEX", "ORACLE", "SIMULATOR", "HANDS",
            "WORLD_MODEL", "TIMELINE", "AI_REPUTATION"
        ]
    }

# Mount all API endpoints
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
