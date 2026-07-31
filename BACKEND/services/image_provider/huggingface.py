# import asyncio
# import httpx

# from .base import ImageProvider
# from config import HF_TOKEN, HF_MODEL

# HF_URL = f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}"


# class HuggingFaceProvider(ImageProvider):
#     async def generate_image(self, prompt: str, width: int, height: int) -> bytes:
#         headers = {
#             "Authorization": f"Bearer {HF_TOKEN}",
#             "Content-Type": "application/json",
#         }
#         payload = {
#             "inputs": prompt,
#             "parameters": {"width": width, "height": height},
#         }

#         async with httpx.AsyncClient(timeout=120) as client:
#             response = await client.post(HF_URL, headers=headers, json=payload)

#             # Free-tier models unload when idle; first hit after a while returns 503
#             # while it "wakes up" — one retry after a short wait fixes almost all of these.
#             if response.status_code == 503:
#                 await asyncio.sleep(15)
#                 response = await client.post(HF_URL, headers=headers, json=payload)

#             response.raise_for_status()
#             return response.content   # raw PNG bytes, not JSON



# services/image_provider/huggingface.py
import asyncio
import io

from huggingface_hub import InferenceClient

from .base import ImageProvider
from config import HF_TOKEN, HF_MODEL, HF_PROVIDER


class HuggingFaceProvider(ImageProvider):
    def __init__(self):
        self.client = InferenceClient(
            provider=HF_PROVIDER,
            api_key=HF_TOKEN,
        )

    async def generate_image(self, prompt: str, width: int, height: int) -> bytes:
        loop = asyncio.get_event_loop()

        pil_image = await loop.run_in_executor(
            None,
            lambda: self.client.text_to_image(prompt, model=HF_MODEL),
        )

        buffer = io.BytesIO()
        pil_image.save(buffer, format="PNG")
        return buffer.getvalue()