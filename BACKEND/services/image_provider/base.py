from abc import ABC, abstractmethod


class ImageProvider(ABC):
    """Contract every image provider must implement."""

    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        width: int,
        height: int,
        reference_image: bytes | None = None,
    ) -> bytes:
        """
        Returns raw image bytes (PNG/JPEG).

        `reference_image` (optional) is the uploaded headshot bytes. Providers
        that support image-to-image should use it as the visual basis for the
        generated output (preserving the subject's face). Providers that only
        support text-to-image should ignore it gracefully.
        """
        ...
