# app/settings.py
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
import json
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Shadujan Project"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: list = ["*"]

    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_WEB_API_KEY: str = ""
    FIREBASE_PROJECT_NUMBER: str = ""
    FIREBASE_PRIVATE_KEY_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_CLIENT_ID: str = ""
    FIREBASE_CLIENT_CERT_URL: str = ""

    # Gemini API Configuration (NEW)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Load Firebase credentials from JSON file
        try:
            with open('firebase-credentials.json', 'r') as f:
                firebase_config = json.load(f)
                self.FIREBASE_PROJECT_ID = firebase_config.get('project_id', '')
                self.FIREBASE_PRIVATE_KEY_ID = firebase_config.get('private_key_id', '')
                self.FIREBASE_PRIVATE_KEY = firebase_config.get('private_key', '')
                self.FIREBASE_CLIENT_EMAIL = firebase_config.get('client_email', '')
                self.FIREBASE_CLIENT_ID = firebase_config.get('client_id', '')
                self.FIREBASE_CLIENT_CERT_URL = firebase_config.get('client_x509_cert_url', '')
        except FileNotFoundError:
            print("Warning: firebase-credentials.json not found")
        except json.JSONDecodeError:
            print("Warning: Invalid JSON in firebase-credentials.json")
        
        # # Load Gemini API key from environment or .env file
        # if not self.GEMINI_API_KEY:
        #     # Try to load from .env file if exists
        #     env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        #     if os.path.exists(env_path):
        #         with open(env_path, 'r') as f:
        #             for line in f:
        #                 if line.startswith('GEMINI_API_KEY='):
        #                     self.GEMINI_API_KEY = line.split('=', 1)[1].strip()
        #                     break

    class Config:
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """
    Returns cached settings instance.
    """
    return Settings()

# Create a global settings instance
settings = get_settings() 