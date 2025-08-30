@echo off
echo 🐳 Building FocusBoost Backend Docker Image...

REM Build the Docker image
docker build -t focusboost-backend:latest .

if %errorlevel% equ 0 (
    echo ✅ Docker image built successfully!
    echo.
    echo 🚀 Starting the container...
    
    REM Run the container
    docker run -d --name focusboost-backend -p 8000:8000 -v %cd%/models:/app/models focusboost-backend:latest
    
    if %errorlevel% equ 0 (
        echo ✅ Container started successfully!
        echo 🌐 Backend is running at: http://localhost:8000
        echo 📊 API docs available at: http://localhost:8000/docs
        echo.
        echo 📋 Container logs:
        docker logs focusboost-backend
    ) else (
        echo ❌ Failed to start container
        pause
        exit /b 1
    )
) else (
    echo ❌ Failed to build Docker image
    pause
    exit /b 1
)

pause
