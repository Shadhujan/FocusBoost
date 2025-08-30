#!/bin/bash

# Build and run script for FocusBoost Backend

echo "🐳 Building FocusBoost Backend Docker Image..."

# Build the Docker image
docker build -t focusboost-backend:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🚀 Starting the container..."
    
    # Run the container
    docker run -d \
        --name focusboost-backend \
        -p 8000:8000 \
        -v $(pwd)/models:/app/models \
        focusboost-backend:latest
    
    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully!"
        echo "🌐 Backend is running at: http://localhost:8000"
        echo "📊 API docs available at: http://localhost:8000/docs"
        echo ""
        echo "📋 Container logs:"
        docker logs focusboost-backend
    else
        echo "❌ Failed to start container"
        exit 1
    fi
else
    echo "❌ Failed to build Docker image"
    exit 1
fi
