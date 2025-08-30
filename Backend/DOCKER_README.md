# FocusBoost Backend - Docker Setup

This document explains how to build and run the FocusBoost backend using Docker.

## Prerequisites

- Docker installed and running
- Docker Compose (optional, for easier management)

## Quick Start

### Option 1: Using the build script (Recommended)

#### Windows:
```bash
# Navigate to backend directory
cd backend-main

# Run the build script
.\build-docker.bat
```

#### Linux/Mac:
```bash
# Navigate to backend directory
cd backend-main

# Make script executable
chmod +x build-docker.sh

# Run the build script
./build-docker.sh
```

### Option 2: Manual Docker commands

```bash
# Build the image
docker build -t focusboost-backend:latest .

# Run the container
docker run -d \
    --name focusboost-backend \
    -p 8000:8000 \
    -v $(pwd)/models:/app/models \
    focusboost-backend:latest
```

### Option 3: Using Docker Compose

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

## Container Management

### View running containers
```bash
docker ps
```

### View logs
```bash
docker logs focusboost-backend
```

### Stop container
```bash
docker stop focusboost-backend
```

### Remove container
```bash
docker rm focusboost-backend
```

### Remove image
```bash
docker rmi focusboost-backend:latest
```

## Accessing the Application

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## Environment Variables

The following environment variables can be customized:

- `PYTHONPATH`: Set to `/app` (default)
- `PYTHONUNBUFFERED`: Set to `1` for immediate log output

## Volumes

The container mounts the following volumes:

- `./models:/app/models` - ML models and data files
- `./logs:/app/logs` - Application logs (if logs directory exists)

## Health Check

The container includes a health check that runs every 30 seconds:

```bash
curl -f http://localhost:8000/health
```

## Troubleshooting

### Port already in use
If port 8000 is already in use, change the port mapping:

```bash
docker run -d --name focusboost-backend -p 8001:8000 focusboost-backend:latest
```

### Permission issues
If you encounter permission issues with mounted volumes, ensure the directories have proper permissions:

```bash
# Create logs directory if it doesn't exist
mkdir -p logs
chmod 755 logs
```

### Build failures
If the Docker build fails:

1. Check that Docker is running
2. Ensure you have sufficient disk space
3. Check the Dockerfile for syntax errors
4. Verify all required files are present

### Container won't start
If the container starts but immediately stops:

1. Check the logs: `docker logs focusboost-backend`
2. Verify the application code is correct
3. Check that all dependencies are properly installed

## Development

For development, you can mount the source code as a volume:

```bash
docker run -d \
    --name focusboost-backend-dev \
    -p 8000:8000 \
    -v $(pwd):/app \
    -v $(pwd)/models:/app/models \
    focusboost-backend:latest
```

This allows you to make changes to the code without rebuilding the image.

## Production Considerations

For production deployment:

1. Use specific version tags instead of `latest`
2. Set up proper logging and monitoring
3. Configure environment-specific variables
4. Set up proper backup strategies for mounted volumes
5. Consider using a reverse proxy (nginx) in front of the application
6. Implement proper security measures

## Support

If you encounter issues:

1. Check the container logs
2. Verify Docker and Docker Compose versions
3. Ensure all prerequisites are met
4. Check the application logs for specific error messages
