# services/image_provider/gemini.py
import base64
import io
import logging

from .base import ImageProvider
from config import GEMINI_API_KEY, GEMINI_IMAGE_MODEL

logger = logging.getLogger(__name__)


class GeminiProvider(ImageProvider):
    """
    Google Gemini 'Nano Banana' (gemini-2.5-flash-image) image editing provider.

    Unlike the text-to-image providers, Gemini accepts the uploaded headshot as
    a reference image and edits/transforms it according to the text prompt while
    preserving the subject's identity (character consistency). Uses the FREE
    Gemini API tier (~500 image requests/day, no credit card required).
    """

    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is not configured. Get a free key from "
                "https://aistudio.google.com/app/apikey"
            )
        # Import lazily so the module can be imported even before the SDK is installed.
        from google import genai

        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model = GEMINI_IMAGE_MODEL

    async def generate_image(
        self,
        prompt: str,
        width: int,
        height: int,
        reference_image: bytes | None = None,
    ) -> bytes:
        from google import genai
        from google.genai import types

        loop = asyncio_get_event_loop()

        if reference_image is not None:
            # Image editing: transform the headshot while keeping the person.
            raw = await loop.run_in_executor(
                None,
                lambda: self._edit(reference_image, prompt),
            )
        else:
            # Text-to-image generation.
            raw = await loop.run_in_executor(
                None,
                lambda: self._generate_text_to_image(prompt, width, height),
            )

        return raw

    def _edit(self, headshot_bytes: bytes, prompt: str) -> bytes:
        from google.genai import types

        # Instruction tuned for face preservation + YouTube thumbnail styles,
        # combined with the style/prompt text from the caller.
        instruction = (
            "Edit the person in this photo into a YouTube thumbnail image. "
            "IMPORTANT: Keep the exact same person/face from the input photo — "
            "do not change their identity, facial features, or resemblance. "
            f"Generate a 16:9 (1280x720) YouTube thumbnail. {prompt}"
        )

        headshot_part = types.Part.from_bytes(
            data=headshot_bytes, mime_type="image/png"
        )
        prompt_part = types.Part.from_text(text=instruction)

        response = self.client.models.generate_content(
            model=self.model,
            contents=[prompt_part, headshot_part],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data is not None and part.inline_data.data:
                return part.inline_data.data

        # If only text came back, surface it as an error.
        text = response.text or "No image generated"
        raise RuntimeError(f"Gemini returned no image: {text[:200]}")

    def _generate_text_to_image(self, prompt: str, width: int, height: int) -> bytes:
        from google.genai import types

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data is not None and part.inline_data.data:
                return part.inline_data.data

        text = response.text or "No image generated"
        raise RuntimeError(f"Gemini returned no image: {text[:200]}")


# google-genai's executor works best on a running event loop; re-export helper.
def asyncio_get_event_loop():
    import asyncio

    try:
        return asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop
