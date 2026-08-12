import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.schemas.common import ApiResponse, ErrorDetail

logger = logging.getLogger("app.core.exceptions")

class HTTPAppException(Exception):
    """Base exception for all application errors that should return an HTTP response."""
    def __init__(
        self, 
        status_code: int, 
        code: str, 
        message: str, 
        details: dict | None = None
    ):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


class BadRequestException(HTTPAppException):
    def __init__(self, message: str = "Bad Request", details: dict | None = None):
        super().__init__(400, "BAD_REQUEST", message, details)


class UnauthorizedException(HTTPAppException):
    def __init__(self, message: str = "Unauthorized", details: dict | None = None):
        super().__init__(401, "UNAUTHORIZED", message, details)


class ForbiddenException(HTTPAppException):
    def __init__(self, message: str = "Forbidden", details: dict | None = None):
        super().__init__(403, "FORBIDDEN", message, details)


class NotFoundException(HTTPAppException):
    def __init__(self, message: str = "Not Found", details: dict | None = None):
        super().__init__(404, "NOT_FOUND", message, details)


class TimeoutException(HTTPAppException):
    def __init__(self, message: str = "Request Timeout", details: dict | None = None):
        super().__init__(408, "REQUEST_TIMEOUT", message, details)


class RateLimitException(HTTPAppException):
    def __init__(self, message: str = "Rate Limit Exceeded", details: dict | None = None):
        super().__init__(429, "RATE_LIMIT_EXCEEDED", message, details)


class LLMProviderException(HTTPAppException):
    def __init__(self, message: str = "LLM Provider Error", details: dict | None = None):
        super().__init__(502, "LLM_PROVIDER_ERROR", message, details)


class SpeechProviderException(Exception):
    """Exception raised for errors in the speech-to-text provider layer."""
    pass


class SpeechValidationException(Exception):
    """Exception raised for validation errors in the speech service layer."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ServiceUnavailableException(HTTPAppException):
    def __init__(self, message: str = "Service Unavailable", details: dict | None = None):
        super().__init__(503, "SERVICE_UNAVAILABLE", message, details)


class GatewayTimeoutException(HTTPAppException):
    def __init__(self, message: str = "Gateway Timeout", details: dict | None = None):
        super().__init__(504, "GATEWAY_TIMEOUT", message, details)


class InternalServerErrorException(HTTPAppException):
    def __init__(self, message: str = "Internal Server Error", details: dict | None = None):
        super().__init__(500, "INTERNAL_SERVER_ERROR", message, details)


def setup_exception_handlers(app: FastAPI) -> None:
    """Configures global exception handlers for the FastAPI application."""

    @app.exception_handler(HTTPAppException)
    async def app_exception_handler(request: Request, exc: HTTPAppException) -> JSONResponse:
        logger.error(f"Application error: {exc.code} - {exc.message} | Details: {exc.details}")
        response_body = ApiResponse[None](
            success=False,
            data=None,
            error=ErrorDetail(
                code=exc.code,
                message=exc.message,
                details=exc.details
            )
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=response_body.model_dump()
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        # Format Pydantic validation errors nicely
        errors = []
        for error in exc.errors():
            errors.append({
                "loc": error.get("loc"),
                "msg": error.get("msg"),
                "type": error.get("type")
            })
        
        logger.warning(f"Validation error on {request.url.path}: {errors}")
        response_body = ApiResponse[None](
            success=False,
            data=None,
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="Request input validation failed.",
                details={"errors": errors}
            )
        )
        return JSONResponse(
            status_code=422,
            content=response_body.model_dump()
        )

    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        logger.error(f"HTTP exception: {exc.status_code} - {exc.detail}")
        code = "HTTP_ERROR"
        if exc.status_code == 404:
            code = "NOT_FOUND"
        elif exc.status_code == 401:
            code = "UNAUTHORIZED"
        elif exc.status_code == 403:
            code = "FORBIDDEN"
        
        response_body = ApiResponse[None](
            success=False,
            data=None,
            error=ErrorDetail(
                code=code,
                message=str(exc.detail),
                details=None
            )
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=response_body.model_dump()
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        # Hide raw exception traceback from API response but log it
        logger.exception("Unhandled system exception occurred:")
        response_body = ApiResponse[None](
            success=False,
            data=None,
            error=ErrorDetail(
                code="INTERNAL_SERVER_ERROR",
                message="An unexpected server error occurred.",
                details=None
            )
        )
        return JSONResponse(
            status_code=500,
            content=response_body.model_dump()
        )
