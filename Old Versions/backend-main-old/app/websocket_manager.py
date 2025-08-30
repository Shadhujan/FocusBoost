# backend-main/app/websocket_manager.py
# Simple WebSocket manager for real-time communication

from fastapi import WebSocket, WebSocketDisconnect
import json
import logging
from typing import Dict, List
import asyncio
from .ml_processor import ml_processor

logger = logging.getLogger(__name__)

class SimpleWebSocketManager:
    def __init__(self):
        # Store active connections: {session_id: websocket}
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept new WebSocket connection"""
        try:
            await websocket.accept()
            self.active_connections[session_id] = websocket
            logger.info(f"✅ WebSocket connected for session: {session_id}")
            
            # Send welcome message
            await self.send_to_session(session_id, {
                'type': 'connected',
                'message': 'WebSocket connected successfully'
            })
            
        except Exception as e:
            logger.error(f"Error connecting WebSocket: {e}")
    
    def disconnect(self, session_id: str):
        """Remove connection"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"🔌 WebSocket disconnected for session: {session_id}")
    
    async def send_to_session(self, session_id: str, message: dict):
        """Send message to specific session"""
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {session_id}: {e}")
                # Remove dead connection
                self.disconnect(session_id)
    
    async def handle_message(self, session_id: str, message: dict):
        """Handle incoming WebSocket message"""
        try:
            message_type = message.get('type')
            
            if message_type == 'frame':
                # Process camera frame
                image_data = message.get('imageData')
                if image_data:
                    result = ml_processor.process_frame(session_id, image_data)
                    if result:
                        # Send analysis result back
                        await self.send_to_session(session_id, {
                            'type': 'analysis',
                            'data': {
                                'learningState': result['learningState'],
                                'emotion': result['emotion'],
                                'attentionScore': result['attentionScore'],
                                'timestamp': result['timestamp']
                            }
                        })
                        
                        # Send intervention if needed
                        if 'intervention' in result:
                            await self.send_to_session(session_id, {
                                'type': 'intervention',
                                'data': result['intervention']
                            })
            
            elif message_type == 'ping':
                # Respond to ping
                await self.send_to_session(session_id, {'type': 'pong'})
            
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def broadcast_to_all(self, message: dict):
        """Send message to all connected sessions"""
        dead_connections = []
        
        for session_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except:
                dead_connections.append(session_id)
        
        # Clean up dead connections
        for session_id in dead_connections:
            self.disconnect(session_id)

# WebSocket endpoint handler
async def websocket_endpoint(websocket: WebSocket, session_id: str, manager: SimpleWebSocketManager):
    """Main WebSocket endpoint"""
    await manager.connect(websocket, session_id)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle message
            await manager.handle_message(session_id, message)
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {session_id}: {e}")
    finally:
        manager.disconnect(session_id)

# Create global instance
websocket_manager = SimpleWebSocketManager()