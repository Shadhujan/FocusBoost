import os
import json
from functools import lru_cache
from typing import List, Optional
from pydantic import BaseSettings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Shadujan Project"
    VERSION: str = "1.0.0"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://localhost:8080",  # Production frontend
    ]

    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_WEB_API_KEY: str = ""
    FIREBASE_PROJECT_NUMBER: str = ""
    FIREBASE_PRIVATE_KEY_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_CLIENT_ID: str = ""
    FIREBASE_CLIENT_CERT_URL: str = ""
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")

    # ML Models Configuration
    LEARNING_MODEL_PATH: str = os.getenv("LEARNING_MODEL_PATH", "models/learning_states_model.h5")
    EMOTION_MODEL_PATH: str = os.getenv("EMOTION_MODEL_PATH", "models/emotion_model.h5")
    
    # ML Model Settings
    MODEL_INPUT_SIZE: tuple = (48, 48)  # Adjust to your model's input size
    ATTENTION_THRESHOLD: float = 0.6
    PROCESSING_INTERVAL: int = 3  # seconds
    
    # Quiz Generation API
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    # OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")  # Alternative
    
    # Database Settings
    MAX_ANALYSIS_HISTORY: int = 1000  # Max records to keep in memory
    BATCH_WRITE_SIZE: int = 10
    
    # WebSocket Settings
    WEBSOCKET_HEARTBEAT_INTERVAL: int = 30  # seconds

    class Config:
        # Point at the .env one level up
        env_file = os.path.join(os.path.dirname(__file__), "..", ".env")
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Load Firebase credentials from JSON file
        self._load_firebase_credentials()
    
    def _load_firebase_credentials(self):
        """Load Firebase credentials from JSON file if it exists."""
        try:
            with open(self.FIREBASE_CREDENTIALS_PATH, 'r') as f:
                firebase_config = json.load(f)
                self.FIREBASE_PROJECT_ID = firebase_config.get('project_id', '')
                self.FIREBASE_PRIVATE_KEY_ID = firebase_config.get('private_key_id', '')
                self.FIREBASE_PRIVATE_KEY = firebase_config.get('private_key', '')
                self.FIREBASE_CLIENT_EMAIL = firebase_config.get('client_email', '')
                self.FIREBASE_CLIENT_ID = firebase_config.get('client_id', '')
                self.FIREBASE_CLIENT_CERT_URL = firebase_config.get('client_x509_cert_url', '')
                self.FIREBASE_WEB_API_KEY = firebase_config.get('web_api_key', '')
                self.FIREBASE_PROJECT_NUMBER = firebase_config.get('project_number', '')
        except FileNotFoundError:
            print(f"Warning: {self.FIREBASE_CREDENTIALS_PATH} not found")
        except json.JSONDecodeError:
            print(f"Warning: Invalid JSON in {self.FIREBASE_CREDENTIALS_PATH}")

@lru_cache()
def get_settings() -> Settings:
    """
    Returns cached settings instance.
    """
    return Settings()

# Create a global settings instance
settings = get_settings()