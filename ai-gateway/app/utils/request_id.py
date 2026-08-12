import uuid
from contextvars import ContextVar

request_id_ctx_var: ContextVar[str] = ContextVar("request_id", default="")

def get_request_id() -> str:
    """Returns the Request ID for the current async execution context."""
    return request_id_ctx_var.get()

def set_request_id(request_id: str) -> None:
    """Sets the Request ID for the current async execution context."""
    request_id_ctx_var.set(request_id)

def generate_request_id() -> str:
    """Generates a new random UUID4 string to serve as a Request ID."""
    return str(uuid.uuid4())
