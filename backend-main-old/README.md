# Backend API

This is the backend API for the project.

# Creating and Activating a Python Virtual Environment

1. Step 1: Create the Virtual Environment

```bash
python -m venv venv_name
```

2. Step 2: Activate the Virtual Environment

```bash
venv_name\Scripts\activate
```

3.  Step 3: Confirm Activation
#### You should see the environment name in your terminal prompt like this:
```bash
(venv_name) your-user-name$
```

4.  Step 4: Deactivate When Done
```bash
deactivate
```

# Creating and Activating Anaconda environment
1. conda env list 
2. conda acivate <environment name>

# Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python -m app.main

Fastapi dev app/main.py
```

# Project Structure

- `app/` - Main application code
  - `main.py` - Application entry point
  - `settings.py` - Configuration settings
  - `user_account/` - User authentication and account management
  - `account_schema/` - Account-related schemas
- `docs/` - Documentation
- `requirements.txt` - Python dependencies 