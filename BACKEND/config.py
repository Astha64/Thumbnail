# import os
# from dotenv import load_dotenv

# load_dotenv()

# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
# IMAGEKIT_PRIVATE_KEY = os.getenv("IMAGEKIT_PRIVATE_KEY", "")
# IMAGEKIT_PUBLIC_KEY = os.getenv("IMAGEKIT_PUBLIC_KEY", "")
# IMAGEKIT_URL_ENDPOINT = os.getenv("IMAGEKIT_URL_ENDPOINT", "")

# DATABASE_URL =  "sqlite:///./thumbnailbuilder.db"

import os
from dotenv import load_dotenv

load_dotenv()

# Image provider selection
IMAGE_PROVIDER = os.getenv("IMAGE_PROVIDER", "huggingface")   # huggingface | pollinations | openai
IMAGE_PROVIDER_FALLBACK = os.getenv("IMAGE_PROVIDER_FALLBACK", "pollinations")  # used if primary fails

# Hugging Face
HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_MODEL = os.getenv("HF_MODEL", "black-forest-labs/FLUX.1-schnell")
# config.py — add this line near the other HF settings
HF_PROVIDER = os.getenv("HF_PROVIDER", "nscale")

# OpenAI 
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# ImageKit
IMAGEKIT_PRIVATE_KEY = os.getenv("IMAGEKIT_PRIVATE_KEY", "")
IMAGEKIT_PUBLIC_KEY = os.getenv("IMAGEKIT_PUBLIC_KEY", "")
IMAGEKIT_URL_ENDPOINT = os.getenv("IMAGEKIT_URL_ENDPOINT", "")

DATABASE_URL = "sqlite:///./thumbnailbuilder.db"

# ==========================================
# Authentication
# ==========================================

JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "THIS_IS_ONLY_FOR_DEVELOPMENT_CHANGE_IT"
)

JWT_ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30

