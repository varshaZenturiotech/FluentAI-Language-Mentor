import logging

logger = logging.getLogger("app.services.avatar_service")

# Static preset weights mapping emotions to standard 3D blend shapes (Mouth, Eyes, Brows)
EMOTION_BLEND_SHAPES: dict[str, dict[str, float]] = {
    "happy": {
        "mouthSmile": 0.8,
        "eyeSquint": 0.3,
        "cheekPuff": 0.1
    },
    "greeting": {
        "mouthSmile": 0.6,
        "browInnerUp": 0.3,
        "eyeWide": 0.1
    },
    "listening": {
        "browInnerUp": 0.1,
        "eyeSquint": 0.1,
        "mouthPress": 0.05
    },
    "thinking": {
        "browDownLeft": 0.3,
        "browDownRight": 0.3,
        "eyeSquint": 0.4,
        "mouthPucker": 0.2
    },
    "explaining": {
        "browInnerUp": 0.3,
        "mouthOpen": 0.25,
        "jawOpen": 0.15
    },
    "encouraging": {
        "mouthSmile": 0.7,
        "browInnerUp": 0.4,
        "eyeWide": 0.2
    },
    "proud": {
        "mouthSmile": 0.5,
        "browInnerUp": 0.3,
        "cheekPuff": 0.2
    },
    "celebrating": {
        "mouthSmile": 0.9,
        "browInnerUp": 0.5,
        "eyeWide": 0.3,
        "jawOpen": 0.1
    },
    "curious": {
        "browInnerUp": 0.4,
        "eyeWide": 0.3,
        "mouthPucker": 0.1
    },
    "concerned": {
        "browInnerUp": 0.5,
        "browDownLeft": 0.2,
        "browDownRight": 0.2,
        "mouthPress": 0.4
    }
}

class AvatarService:
    """Service to map conversational emotions directly into 3D avatar blend-shape parameters."""
    
    def map_emotion_to_blend_shapes(self, emotion: str) -> dict[str, float] | None:
        """Looks up the blend shape preset weights for a given emotion.
        Returns a dictionary of blend shape parameters or None if not found.
        """
        preset = EMOTION_BLEND_SHAPES.get(emotion.lower())
        if not preset:
            logger.warning(f"No blend shape preset mapped for emotion: '{emotion}'")
            return None
        return preset

# Singleton avatar service instance
avatar_service = AvatarService()
