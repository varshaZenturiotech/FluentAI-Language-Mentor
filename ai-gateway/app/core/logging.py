import logging
import sys
from app.core.config import settings
from app.utils.request_id import get_request_id

class RequestIDFilter(logging.Filter):
    """Logging filter that automatically injects the current Request ID from the context into the log record."""
    def filter(self, record):
        record.request_id = get_request_id() or "SYSTEM"
        return True

def setup_logging() -> None:
    """Initializes the application-wide logging configuration with request tracing capabilities."""
    log_level_str = settings.LOG_LEVEL.upper()
    level = getattr(logging, log_level_str, logging.INFO)

    # Standard log format including request_id
    log_format = (
        "[%(asctime)s] [%(levelname)s] [%(request_id)s] [%(name)s:%(lineno)d] - %(message)s"
    )

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers to avoid duplicates
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Set up console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # Apply formatter and request ID filter
    formatter = logging.Formatter(log_format)
    console_handler.setFormatter(formatter)
    
    req_filter = RequestIDFilter()
    console_handler.addFilter(req_filter)
    
    root_logger.addHandler(console_handler)

    # Silence verbose default loggers if in INFO mode
    if level == logging.INFO:
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
        logging.getLogger("urllib3").setLevel(logging.WARNING)

    logger = logging.getLogger("app.core.logging")
    logger.info(f"Logging initialized with level: {log_level_str}")
