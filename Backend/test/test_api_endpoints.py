# test_api_endpoints.py
import pytest
import requests

BASE_URL = "http://localhost:8000"

def test_login_valid_credentials():
    response = requests.post(f"{BASE_URL}/auth/login", 
                           json={"email": "test@test.com", "password": "validpass"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_start_session():
    response = requests.post(f"{BASE_URL}/api/sessions/start",
                           json={"childId": "test_child"})
    assert response.status_code == 201
    assert "sessionId" in response.json()