from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slices.core.config import settings
from slices.health_check.api.routes import router as health_router


def create_app() -> FastAPI:
    """Create FastAPI application with all configurations."""

    app = FastAPI(
        title=settings.project_name,
        version="1.0.0",
        openapi_url=f"{settings.api_v1_str}/openapi.json",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health_router, tags=["health"])

    return app


app = create_app()
