// Frontend/src/services/apiService.ts
// Service to handle all API calls to your FastAPI backend

interface AnalysisResult {
  learningState: string;
  learningConfidence: number;
  emotion: string;
  emotionConfidence: number;
  attentionScore: number;
  timestamp: string;
}

interface InterventionData {
  id?: string;
  type: 'quiz' | 'break' | 'hint';
  reason: string;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  message?: string;
  duration?: number;
}

interface SessionData {
  sessionId: string;
  childId: string;
  subject: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'paused';
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.authToken = localStorage.getItem('authToken');
  }

  // Set auth token
  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  // Clear auth token
  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('authToken');
  }

  // Generic API call method
  private async apiCall<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || data.error || 'API call failed' };
      }
    } catch (error) {
      console.error('API call error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  // ===========================
  // ML ANALYSIS ENDPOINTS
  // ===========================

  // Analyze single frame with your two ML models
  async analyzeFrame(sessionId: string, imageData: string): Promise<ApiResponse<{
    analysis: AnalysisResult;
    intervention?: InterventionData;
  }>> {
    return this.apiCall('/api/analyze-base64', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        imageData
      })
    });
  }

  // ===========================
  // SESSION MANAGEMENT
  // ===========================

  // Start new study session
  async startSession(childId: string, subject: string = 'general'): Promise<ApiResponse<{ sessionId: string }>> {
    return this.apiCall('/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({
        childId,
        subject,
        startTime: new Date().toISOString()
      })
    });
  }

  // End study session
  async endSession(sessionId: string): Promise<ApiResponse<{ sessionId: string }>> {
    return this.apiCall('/api/sessions/end', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        endTime: new Date().toISOString()
      })
    });
  }

  // Get session summary
  async getSessionSummary(sessionId: string): Promise<ApiResponse<{
    session: SessionData;
    averageAttentionScore: number;
    totalAnalyses: number;
    dominantLearningState: string;
    dominantEmotion: string;
    interventionCount: number;
    recentAnalyses: AnalysisResult[];
  }>> {
    return this.apiCall(`/api/session/${sessionId}/summary`);
  }

  // ===========================
  // QUIZ SYSTEM
  // ===========================

  // Submit quiz answer
  async submitQuizAnswer(
    quizId: string, 
    userAnswer: number, 
    responseTime: number
  ): Promise<ApiResponse<{
    isCorrect: boolean;
    correctAnswer: number;
    xpReward: number;
  }>> {
    return this.apiCall(`/api/quiz/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        userAnswer,
        responseTime
      })
    });
  }

  // ===========================
  // CHILD MANAGEMENT
  // ===========================

  // Create new child profile
  async createChild(childData: {
    name: string;
    age: number;
    grade: string;
    parentId: string;
  }): Promise<ApiResponse<{ childId: string }>> {
    return this.apiCall('/api/children', {
      method: 'POST',
      body: JSON.stringify(childData)
    });
  }

  // Get children for a parent
  async getChildren(parentId: string): Promise<ApiResponse<{
    id: string;
    name: string;
    age: number;
    grade: string;
    createdAt: string;
  }[]>> {
    return this.apiCall(`/api/children?parentId=${parentId}`);
  }

  // Update child profile
  async updateChild(
    childId: string, 
    updateData: Partial<{
      name: string;
      age: number;
      grade: string;
      settings: any;
    }>
  ): Promise<ApiResponse<{ childId: string }>> {
    return this.apiCall(`/api/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  // ===========================
  // DASHBOARD & ANALYTICS
  // ===========================

  // Get child overview for dashboard
  async getChildOverview(childId: string): Promise<ApiResponse<{
    child: {
      id: string;
      name: string;
      age: number;
      grade: string;
    };
    recentSessions: SessionData[];
    totalStudyTime: number;
    averageAttentionScore: number;
    learningStateDistribution: Record<string, number>;
    emotionDistribution: Record<string, number>;
    improvementTrend: 'improving' | 'stable' | 'declining';
  }>> {
    return this.apiCall(`/api/dashboard/child/${childId}`);
  }

  // Get session history for a child
  async getSessionHistory(
    childId: string, 
    limit: number = 10
  ): Promise<ApiResponse<SessionData[]>> {
    return this.apiCall(`/api/dashboard/sessions/${childId}?limit=${limit}`);
  }

  // ===========================
  // AUTHENTICATION
  // ===========================

  // Login
  async login(email: string, password: string): Promise<ApiResponse<{
    access_token: string;
    token_type: string;
    user: {
      id: string;
      email: string;
      displayName: string;
    };
  }>> {
    const result = await this.apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (result.success && result.data?.access_token) {
      this.setAuthToken(result.data.access_token);
    }

    return result;
  }

  // Register
  async register(userData: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<ApiResponse<{
    access_token: string;
    token_type: string;
    user: {
      id: string;
      email: string;
      displayName: string;
    };
  }>> {
    const result = await this.apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (result.success && result.data?.access_token) {
      this.setAuthToken(result.data.access_token);
    }

    return result;
  }

  // Refresh token
  async refreshToken(): Promise<ApiResponse<{
    access_token: string;
    token_type: string;
  }>> {
    const result = await this.apiCall('/api/auth/refresh', {
      method: 'POST'
    });

    if (result.success && result.data?.access_token) {
      this.setAuthToken(result.data.access_token);
    }

    return result;
  }

  // Logout
  logout(): void {
    this.clearAuthToken();
  }
}

// ===========================
// WEBSOCKET SERVICE
// ===========================

interface WebSocketMessage {
  type: string;
  data: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private onMessage: ((message: WebSocketMessage) => void) | null = null;
  private onError: ((error: Event) => void) | null = null;

  constructor(private baseURL: string = 'ws://localhost:8000') {}

  // Connect to WebSocket for real-time session data
  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.sessionId = sessionId;
        this.ws = new WebSocket(`${this.baseURL}/ws/${sessionId}`);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected for session:', sessionId);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            if (this.onMessage) {
              this.onMessage(message);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (this.onError) {
            this.onError(error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  // Send frame data via WebSocket
  sendFrameData(imageData: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'frame',
        imageData: imageData
      }));
    }
  }

  // Send ping to keep connection alive
  ping(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  // Set message handler
  setMessageHandler(handler: (message: WebSocketMessage) => void): void {
    this.onMessage = handler;
  }

  // Set error handler
  setErrorHandler(handler: (error: Event) => void): void {
    this.onError = handler;
  }

  // Attempt to reconnect
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.sessionId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(this.sessionId!);
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
    this.reconnectAttempts = 0;
  }

  // Check if connected
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// ===========================
// EXPORT SINGLETON INSTANCES
// ===========================

// Create singleton instances
export const apiService = new ApiService();
export const webSocketService = new WebSocketService();

// Export types for use in components
export type {
  AnalysisResult,
  InterventionData,
  SessionData,
  ApiResponse,
  WebSocketMessage
};

// ===========================
// REACT HOOKS FOR EASY USAGE
// ===========================

import { useState, useEffect } from 'react';

// Hook for API calls with loading state
export const useApiCall = <T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const result = await apiCall();

      if (isMounted) {
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || 'Unknown error');
        }
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { data, loading, error };
};

// Hook for WebSocket connection
export const useWebSocket = (sessionId: string | null) => {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const connect = async () => {
      try {
        await webSocketService.connect(sessionId);
        setConnected(true);

        webSocketService.setMessageHandler((message) => {
          setLastMessage(message);
        });

        webSocketService.setErrorHandler(() => {
          setConnected(false);
        });

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setConnected(false);
      }
    };

    connect();

    return () => {
      webSocketService.disconnect();
      setConnected(false);
    };
  }, [sessionId]);

  return { connected, lastMessage };
};