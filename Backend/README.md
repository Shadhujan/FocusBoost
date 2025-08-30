# Backend API

This is the backend API for the project.

## Setup

### Create a conda or venv enviornment then activate it

### then install the dependencies
1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
fastapi dev app/main.py
```
3. Swagger UI
```bash
http://127.0.0.1:8000/docs#/
```

## Project Structure

- `app/` - Main application code
  - `main.py` - Application entry point and API handlers
  - `settings.py` - Configuration settings
  - `user_account/` - User authentication and account management
  - `account_schema/` - Account-related schemas
  - `attention_tracking/` - Attention management logic
  - `ml_processing/` - Machine learning analysis logic
  - `quiz_management/` - Quiz generation and management
  - `session_management/` - Session-related APIs
- `docs/` - Documentation
- `models/` - ML Models
- `test/` - Unit and integration tests
- `requirements.txt` - Python dependencies