import logging
from fastapi import FastAPI
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import setup_exception_handlers
from app.core.middleware import InternalAuthAndTracingMiddleware
from app.api import health, pronunciation, translate, chat, speech, study_plan, learning, conversational_assessment

# 1. Initialize global logging
setup_logging()
logger = logging.getLogger("app.main")

# 2. Instantiate FastAPI App
app = FastAPI(
    title="FluentAI AI Gateway",
    description="Stateless internal FastAPI microservice for orchestrating LLM dialog turns, translation, and speech evaluation.",
    version="1.0.0"
)

# 3. Register Tracing & Authentication Middleware
app.add_middleware(InternalAuthAndTracingMiddleware)

# 4. Register Global Exception Handlers
setup_exception_handlers(app)

# 5. Include API Routers
app.include_router(health.router, prefix="/internal")
app.include_router(pronunciation.router, prefix="/internal")
app.include_router(translate.router, prefix="/internal")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(speech.router, prefix="/api/v1")
app.include_router(study_plan.router, prefix="/api/v1")
app.include_router(learning.router, prefix="/api/v1")
app.include_router(conversational_assessment.router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    import os
    logger.info("==================================================")
    logger.info("       FluentAI AI Gateway starting up            ")
    logger.info("       Provider: groq")
    logger.info(f"       Loaded Model: {settings.GROQ_MODEL}")
    logger.info(f"       API Key Present: {bool(settings.GROQ_API_KEY)}")
    
    prompt_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prompts", "chat_system.txt")
    prompt_exists = os.path.exists(prompt_path)
    logger.info(f"       Prompt Loaded: {prompt_exists}")
    logger.info(f"       Running on port: {settings.PORT}")
    logger.info("==================================================")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("FluentAI AI Gateway shutting down.")
