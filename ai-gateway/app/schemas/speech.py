from pydantic import BaseModel, Field

class UploadAudioResponse(BaseModel):
    success: bool = Field(..., description="Indicates if the upload was successful")
    message: str = Field(..., description="Status message description")
