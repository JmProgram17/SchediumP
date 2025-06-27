# app/core/security/cors.py
"""
CORS configuration for the application.
Handles cross-origin resource sharing securely.
"""

from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings


def configure_cors(app: FastAPI) -> None:
    """Configure CORS middleware with security best practices."""

    # Parse allowed origins
    origins = []

    if settings.BACKEND_CORS_ORIGINS:
        origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]

    # Add localhost for development
    if settings.IS_DEVELOPMENT:
        origins.extend([
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:8080",
        ])

    # More permissive CORS for development
    if settings.IS_DEVELOPMENT:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,  # Use specific origins with credentials
            allow_credentials=True,
            allow_methods=["*"],  # Allow all methods
            allow_headers=["*"],  # Allow all headers
            expose_headers=[
                "X-Request-ID",
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                "X-RateLimit-Reset",
                "X-Total-Count",
            ],
            max_age=3600,
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allow_headers=[
                "Accept",
                "Accept-Language", 
                "Authorization",
                "Cache-Control",
                "Content-Language",
                "Content-Type",
                "X-API-Key",
                "X-Request-ID",
                "X-Requested-With"
            ],
            expose_headers=[
                "X-Request-ID",
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                "X-RateLimit-Reset",
                "X-Total-Count",
            ],
            max_age=3600,
        )
