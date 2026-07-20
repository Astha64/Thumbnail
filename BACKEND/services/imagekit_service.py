from imagekitio import ImageKit

from config import IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT

imagekit = ImageKit(private_key=IMAGEKIT_PRIVATE_KEY)

def upload_file(file_bytes: bytes, file_name: str, folder: str, content_type: str = "image/png") -> str:
    
    """Uploads a file to ImageKit and returns the URL of the uploaded file.
    
    Args:
        file_bytes (bytes): The bytes of the file to be uploaded.
        file_name (str): The name of the file to be uploaded.
        folder (str): The folder in which to upload the file.
        content_type (str, optional): The content type of the file. Defaults to "image/png".
        
    Returns:
        str: The URL of the uploaded file.
    """
    result = imagekit.files.upload(
        file=(file_bytes, file_name, content_type),
        file_name=file_name,
        folder=folder,
        is_private_file=False,
        use_unique_file_name=True,
    )
    return result.url

def get_variants(base_url:str) -> dict:
    """Returns 3 sizes variant URLs using imagekit transformation.
    
    Args:
        base_url (str): The base URL for which to generate variant URLs.        
        """
    return {
        "youtube": f"{base_url}?tr=w-1280,h-720,fo-auto,c-maintain_ratio",
        "shorts": f"{base_url}?tr=w-1080,h-1920,fo-auto,c-maintain_ratio",
        "square": f"{base_url}?tr=w-1080,h-1080,fo-auto,c-maintain_ratio",
    }