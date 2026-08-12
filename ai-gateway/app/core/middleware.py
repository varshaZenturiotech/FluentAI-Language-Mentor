import time
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.security import validate_internal_api_key
from app.utils.request_id import generate_request_id, set_request_id
from app.schemas.common import ApiResponse, ErrorDetail

class InternalAuthAndTracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Tracing: Handle Request ID
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = generate_request_id()
        set_request_id(request_id)

        # 2. Authentication: Check all endpoints by default, excluding public allowlist
        PUBLIC_PATHS = {"/internal/health"}
        
        path = request.url.path
        if path not in PUBLIC_PATHS:
            internal_key = request.headers.get("X-Internal-Key")
            if not validate_internal_api_key(internal_key):
                # Return standard ApiResponse error wrapper
                error_response = ApiResponse[None](
                    success=False,
                    data=None,
                    error=ErrorDetail(
                        code="UNAUTHORIZED",
                        message="Unauthorized access. Invalid or missing X-Internal-Key."
                    )
                )
                return JSONResponse(
                    status_code=401,
                    content=error_response.model_dump()
                )

        # 3. Request timing & execution
        start_time = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            # Errors will be caught by exception handlers, but we ensure the request context propagates
            raise
        finally:
            process_time = time.perf_counter() - start_time

        # 4. Headers setting
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{process_time:.4f}s"
        
        return response
