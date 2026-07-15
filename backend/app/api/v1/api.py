from fastapi import APIRouter
from app.api.v1.endpoints import auth, portfolio, media, game_config

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(game_config.router, prefix="/game-config", tags=["game-config"])
