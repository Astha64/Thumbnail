from abc import ABC, abstractmethod


class ImageProvider(ABC):
    """Contract every image provider must implement."""

    @abstractmethod
    async def generate_image(self, prompt: str, width: int, height: int) -> bytes:
        """Returns raw image bytes (PNG/JPEG)."""
        ...