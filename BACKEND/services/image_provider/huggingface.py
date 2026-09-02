# services/image_provider/huggingface.py
import asyncio
import io
import logging

from huggingface_hub import InferenceClient

from .base import ImageProvider
from config import HF_TOKEN, HF_MODEL, HF_PROVIDER, HF_KONTEXT_MODEL

logger = logging.getLogger(__name__)

# Provider that supports image-to-image for the Kontext model (in priority order).
_I2I_PROVIDERS = ["fal-ai", "replicate"]


class HuggingFaceProvider(ImageProvider):
    def __init__(self):
        self.client = InferenceClient(
            provider=HF_PROVIDER,
            api_key=HF_TOKEN,
        )

    async def generate_image(
        self,
        prompt: str,
        width: int,
        height: int,
        reference_image: bytes | None = None,
    ) -> bytes:
        loop = asyncio.get_event_loop()

        if reference_image is not None:
            pil_image = await self._image_to_image(prompt, reference_image, loop)
        else:
            # Text-to-image fallback (no reference provided).
            pil_image = await loop.run_in_executor(
                None,
                lambda: self.client.text_to_image(prompt, model=HF_MODEL),
            )

        buffer = io.BytesIO()
        pil_image.save(buffer, format="PNG")
        return buffer.getvalue()

    async def _image_to_image(self, prompt: str, reference_image: bytes, loop) -> object:
        """
        Uses the FLUX.1-Kontext-dev image editing model to transform the uploaded
        headshot according to the prompt while preserving the subject's face.

        Tries providers in order (fal-ai first, then replicate) since support
        varies by provider.
        """
        last_error = None
        for provider in _I2I_PROVIDERS:
            try:
                client = InferenceClient(provider=provider, api_key=HF_TOKEN)
                pil_image = await loop.run_in_executor(
                    None,
                    lambda: client.image_to_image(
                        reference_image,
                        prompt=prompt,
                        model=HF_KONTEXT_MODEL,
                    ),
                )
                return pil_image
            except Exception as e:
                last_error = e
                logger.warning(f"image_to_image via {provider} failed ({e}); trying next provider")

        raise RuntimeError(f"All image-to-image providers failed. Last error: {last_error}")
