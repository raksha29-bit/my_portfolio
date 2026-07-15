import os
import shutil
import uuid
from abc import ABC, abstractmethod
from fastapi import UploadFile


class BaseStorageProvider(ABC):
    @abstractmethod
    def upload_file(self, file: UploadFile, folder: str = "media") -> dict:
        """
        Uploads a file to the storage provider.
        Returns a dictionary with keys: secure_url, public_id, resource_type, file_format, file_size, width, height
        """
        pass

    @abstractmethod
    def delete_file(self, public_id: str) -> bool:
        """
        Deletes a file from the storage provider by its public ID.
        """
        pass


class LocalStorageProvider(BaseStorageProvider):
    def __init__(self, upload_dir: str = "app/static/uploads"):
        self.upload_dir = upload_dir
        # Create directories if they do not exist
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload_file(self, file: UploadFile, folder: str = "media") -> dict:
        # Extract extension
        original_name = file.filename or "file"
        file_ext = os.path.splitext(original_name)[1].lower().replace(".", "")
        
        # Generate a unique key/public_id
        public_id = f"{folder}/{uuid.uuid4()}"
        
        # Determine resource type
        resource_type = "image"
        if file_ext in ["mp4", "webm", "avi", "mov"]:
            resource_type = "video"
        elif file_ext in ["pdf", "zip", "txt"]:
            resource_type = "raw"
            
        # Target path on disk
        clean_prefix = public_id.replace('/', '_')
        filename = f"{clean_prefix}.{file_ext}" if file_ext else clean_prefix
        file_path = os.path.join(self.upload_dir, filename)
        
        # Write file contents
        file.file.seek(0)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Get metadata
        file_size = os.path.getsize(file_path)
        
        # Serving path
        secure_url = f"/static/uploads/{filename}"
        
        return {
            "secure_url": secure_url,
            "public_id": public_id,
            "resource_type": resource_type,
            "file_format": file_ext,
            "file_size": file_size,
            "width": None,
            "height": None
        }

    def delete_file(self, public_id: str) -> bool:
        clean_prefix = public_id.replace('/', '_')
        deleted_any = False
        try:
            for filename in os.listdir(self.upload_dir):
                if filename.startswith(clean_prefix):
                    file_path = os.path.join(self.upload_dir, filename)
                    os.remove(file_path)
                    deleted_any = True
        except OSError:
            pass
        return deleted_any


# Global instance of the storage provider
_storage_provider = LocalStorageProvider()


def get_storage_provider() -> BaseStorageProvider:
    return _storage_provider
