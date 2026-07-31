# services/image_provider/openai_provider.py
import base64
from openai import AsyncOpenAI

from .base import ImageProvider
from config import OPENAI_API_KEY


class OpenAIProvider(ImageProvider):
    def __init__(self):
        # Client is built only when this provider is actually instantiated
        # (i.e. only if IMAGE_PROVIDER=openai), not at import time.
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def generate_image(self, prompt: str, width: int, height: int) -> bytes:
        response = await self.client.responses.create(
            model="gpt-4.1-mini",
            input=[{"role": "user", "content": [{"type": "input_text", "text": prompt}]}],
            tools=[{"type": "image_generation", "size": f"{width}x{height}", "quality": "high"}],
        )
        for item in response.output:
            if item.type == "image_generation_call" and item.result:
                return base64.b64decode(item.result)
        raise RuntimeError("No image result found in OpenAI response")