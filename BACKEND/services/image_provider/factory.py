import logging

from config import IMAGE_PROVIDER, IMAGE_PROVIDER_FALLBACK
from .huggingface import HuggingFaceProvider
from .pollinations import PollinationsProvider
from .openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)

_PROVIDERS = {
    "huggingface": HuggingFaceProvider,
    "pollinations": PollinationsProvider,
    "openai": OpenAIProvider,
}


def _build(name: str):
    provider_cls = _PROVIDERS.get(name)
    if not provider_cls:
        raise ValueError(f"Unknown IMAGE_PROVIDER: {name}")
    return provider_cls()


def get_provider():
    """Returns the configured primary provider instance."""
    return _build(IMAGE_PROVIDER)


async def generate_with_fallback(prompt: str, width: int, height: int) -> bytes:
    """
    Tries the primary provider; if it raises, falls back to IMAGE_PROVIDER_FALLBACK
    (set to the same value as IMAGE_PROVIDER to disable fallback).
    """
    primary = _build(IMAGE_PROVIDER)
    try:
        return await primary.generate_image(prompt, width, height)
    except Exception as e:
        logger.warning(f"{IMAGE_PROVIDER} failed ({e}), falling back to {IMAGE_PROVIDER_FALLBACK}")
        if IMAGE_PROVIDER_FALLBACK == IMAGE_PROVIDER:
            raise   # fallback disabled or same as primary — don't retry pointlessly
        fallback = _build(IMAGE_PROVIDER_FALLBACK)
        return await fallback.generate_image(prompt, width, height)