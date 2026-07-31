import httpx
from urllib.parse import quote

from .base import ImageProvider

POLLINATIONS_BASE_URL = "https://image.pollinations.ai/prompt"


class PollinationsProvider(ImageProvider):
    async def generate_image(self, prompt: str, width: int, height: int) -> bytes:
        encoded_prompt = quote(prompt)
        url = (
            f"{POLLINATIONS_BASE_URL}/{encoded_prompt}"
            f"?width={width}&height={height}&nologo=true&model=flux"
        )
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content