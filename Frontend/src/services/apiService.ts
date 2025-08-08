// Frontend/src/services/apiService.ts
// Updated API service to match your actual FastAPI backend

// ===========================
// TYPES MATCHING YOUR BACKEND
// ===========================

interface UserRegister {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface UserLogin {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface UserResponse {
  id: string;
  full_name: string;
  email: string;
}

interface ChildCreate {
  name: string;
  age: number;
  parentId: string;
  seed?: string;
}

interface ChildResponse {
  id: string;
  name: string;
  age: number;
  parentId: string;
  avatar: string;
  seed: string;
  createdAt: string;
}

interface ChildUpdate {
  name?: string;
  age?: number;
  seed?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface BackendResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  detail?: string;
  message?: string;
}

// ===========================
// QUIZ MANAGEMENT TYPES
// ===========================

interface QuizGenerateRequest {
  childId: string;
  sessionId: string;
  subject: string;
  attentionScore: number;
  learningState?: string;
}

interface Quiz {
  quiz_id: string;
  question: string;
  options: string[];
  correct_index: number;
  hint: string;
  explanation: string;
  fun_fact?: string;
  xp_reward: number;
  difficulty: string;
}

interface QuizSubmitRequest {
  sessionId: string;
  quizId: string;
  selectedAnswer: number;
  correctAnswer: number;
  timeTaken: number;
  xpReward: number;
}

// ===========================
// SESSION MANAGEMENT TYPES
// ===========================

interface SessionSettings {
  sessionDuration: number;     // minutes
  breakDuration: number;       // minutes
  difficultyLevel: 'easy' | 'medium' | 'hard';
  subjects: string[];
  enableQuizzes: boolean;
  enableBreakReminders: boolean;
}

interface StudySession {
  sessionId: string;
  childId: string;
  parentId: string;
  subject: string;
  startTime: string;
  endTime?: string;
  plannedDuration: number;     // seconds
  actualDuration?: number;     // seconds
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  settings: SessionSettings;
  results?: {
    totalTime: number;
    focusedTime: number;
    distractedTime: number;
    averageAttentionScore: number;
    quizzesTaken: number;
    correctAnswers: number;
    xpEarned: number;
    emotionSummary: {
      happy: number;
      focused: number;
      distracted: number;
      frustrated: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface SessionAnalytics {
  totalSessions: number;
  completedSessions: number;
  totalStudyTime: number;
  averageSessionLength: number;
  averageFocusScore: number;
  mostStudiedSubject: string;
  subjectDistribution: Record<string, number>;
}

// ===========================
// ML ANALYSIS TYPES
// ===========================

interface MLAnalysisRequest {
  sessionId: string;
  imageData: string; // base64 encoded image
  timestamp: number;
}

interface MLAnalysisResult {
  emotion: {
    emotion: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  learningState: {
    learningState: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  attentionScore: number;
  timestamp: number;
  nextSampleInterval?: number; // seconds until next analysis
  intervention?: {
    needed: boolean;
    type: string;
    reason: string;
    urgency: string;
  };
}

interface MLAnalysisResponse {
  success: boolean;
  analysis?: MLAnalysisResult;
  intervention?: any;
  error?: string;
}

// ===========================
// API SERVICE CLASS
// ===========================

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
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      console.log(`🔗 API Call: ${options.method || 'GET'} ${this.baseURL}${endpoint}`);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      console.log(`📥 Response:`, data);

      if (response.ok) {
        return { success: true, data };
      } else {
        return { 
          success: false, 
          error: data.detail || data.message || data.error || 'API call failed' 
        };
      }
    } catch (error) {
      console.error('🚨 API call error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  // ===========================
  // AUTHENTICATION ENDPOINTS
  // ===========================

  // Register new user
  async register(userData: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<ApiResponse<UserResponse>> {
    const result = await this.apiCall<UserResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    return result;
  }

  // Login user
  async login(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<ApiResponse<{
    access_token: string;
    token_type: string;
    user_id: string;
    email: string;
    full_name: string;
  }>> {
    const result = await this.apiCall<{
      access_token: string;
      token_type: string;
      user_id: string;
      email: string;
      full_name: string;
    }>('/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        remember_me: credentials.rememberMe || false
      })
    });

    // Store token if login successful
    if (result.success && result.data?.access_token) {
      this.setAuthToken(result.data.access_token);
    }

    return result;
  }

  // Forgot password
  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.apiCall<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Get all users (admin)
  async getAllUsers(): Promise<ApiResponse<any[]>> {
    return this.apiCall<any[]>('/users');
  }

  // Logout
  logout(): void {
    this.clearAuthToken();
  }

  // ===========================
  // CHILD MANAGEMENT ENDPOINTS
  // ===========================

  // Create child profile
  async createChild(childData: {
    name: string;
    age: number;
    parentId: string;
    seed?: string;
  }): Promise<ApiResponse<ChildResponse>> {
    return this.apiCall<ChildResponse>('/api/children', {
      method: 'POST',
      body: JSON.stringify(childData)
    });
  }

  // Get children for a parent
  async getChildrenByParent(parentId: string): Promise<ApiResponse<{
    success: boolean;
    children: ChildResponse[];
    count: number;
  }>> {
    return this.apiCall<{
      success: boolean;
      children: ChildResponse[];
      count: number;
    }>(`/api/children/${parentId}`);
  }

  // Get specific child by ID
  async getChildById(childId: string): Promise<ApiResponse<{
    success: boolean;
    child: ChildResponse;
  }>> {
    return this.apiCall<{
      success: boolean;
      child: ChildResponse;
    }>(`/api/children/child/${childId}`);
  }

  // Update child profile
  async updateChild(
    childId: string, 
    updateData: ChildUpdate
  ): Promise<ApiResponse<{
    success: boolean;
    child: ChildResponse;
  }>> {
    return this.apiCall<{
      success: boolean;
      child: ChildResponse;
    }>(`/api/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  // Delete child profile
  async deleteChild(childId: string): Promise<ApiResponse<{
    success: boolean;
    message: string;
  }>> {
    return this.apiCall<{
      success: boolean;
      message: string;
    }>(`/api/children/${childId}`, {
      method: 'DELETE'
    });
  }

  // ===========================
  // QUIZ MANAGEMENT ENDPOINTS
  // ===========================

  // Generate quiz
  async generateQuiz(data: QuizGenerateRequest): Promise<ApiResponse<{quiz: Quiz}>> {
    try {
      const response = await fetch(`${this.baseURL}/api/quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
        },
        body: JSON.stringify({
          ...data,
          attentionScore: Math.round(data.attentionScore),
          learningState: data.learningState || 'neutral'
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Quiz generation failed:', result);
        throw new Error(result.detail || JSON.stringify(result.detail) || 'Quiz generation failed');
      }

      // Normalize to always return { quiz }
      const normalized = result && typeof result === 'object'
        ? (result.quiz ? { quiz: result.quiz } : { quiz: result })
        : { quiz: result };

      return { success: true, data: normalized };
    } catch (error) {
      console.error('Quiz generation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate quiz' 
      };
    }
  }

  // Submit quiz answer
  async submitQuizAnswer(data: QuizSubmitRequest): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || 'Failed to submit answer');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Quiz submission error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit quiz answer' 
      };
    }
  }

  // Check quiz system status
  async getQuizStatus(): Promise<ApiResponse<any>> {
    return this.apiCall<any>('/api/quiz/status');
  }

  // ===========================
  // SESSION MANAGEMENT ENDPOINTS
  // ===========================

  // Start new study session
  async startSession(sessionData: {
    childId: string;
    subject: string;
    plannedDuration: number;
    settings?: Partial<SessionSettings>;
  }): Promise<ApiResponse<{
    sessionId: string;
    startTime: string;
    message: string;
  }>> {
    return this.apiCall('/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  // End active study session
  async endSession(sessionData: {
    sessionId: string;
    endTime: string;
    actualDuration: number;
    results?: {
      focusedTime?: number;
      averageAttentionScore?: number;
      notes?: string;
    };
  }): Promise<ApiResponse<{
    sessionSummary: {
      sessionId: string;
      duration: number;
      focusedTime: number;
      averageAttentionScore: number;
      xpEarned: number;
    };
    message: string;
  }>> {
    return this.apiCall(`/api/sessions/${sessionData.sessionId}/end`, {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  // Get specific session details
  async getSession(sessionId: string): Promise<ApiResponse<{
    session: StudySession;
  }>> {
    return this.apiCall(`/api/sessions/${sessionId}`);
  }

  // Get sessions for a child
  async getChildSessions(
    childId: string,
    options?: {
      limit?: number;
      statusFilter?: 'active' | 'completed' | 'paused' | 'cancelled';
    }
  ): Promise<ApiResponse<{
    sessions: StudySession[];
    totalCount: number;
  }>> {
    const params = new URLSearchParams();
    
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    
    if (options?.statusFilter) {
      params.append('status_filter', options.statusFilter);
    }
    
    const queryString = params.toString();
    const url = `/api/sessions/child/${childId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.apiCall<{
      success: boolean;
      sessions: StudySession[];
      totalCount: number;
    }>(url);
    
    // Handle the backend response structure
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          sessions: response.data.sessions,
          totalCount: response.data.totalCount
        }
      };
    }
    
    return response;
  }

  // Get session analytics for a child
  async getChildAnalytics(
    childId: string,
    days: number = 7
  ): Promise<ApiResponse<{
    analytics: SessionAnalytics;
    period: string;
  }>> {
    const response = await this.apiCall<{
      success: boolean;
      analytics: SessionAnalytics;
      period: string;
    }>(`/api/sessions/child/${childId}/analytics?days=${days}`);
    
    // Handle the backend response structure
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          analytics: response.data.analytics,
          period: response.data.period
        }
      };
    }
    
    return response;
  }

  // Get all active sessions (admin)
  async getActiveSessions(): Promise<ApiResponse<{
    activeSessions: StudySession[];
    count: number;
  }>> {
    return this.apiCall('/api/sessions/active');
  }

  // Pause session
  async pauseSession(sessionId: string): Promise<ApiResponse<{
    message: string;
  }>> {
    return this.apiCall(`/api/sessions/${sessionId}/pause`, {
      method: 'POST'
    });
  }

  // Resume session
  async resumeSession(sessionId: string): Promise<ApiResponse<{
    message: string;
  }>> {
    return this.apiCall(`/api/sessions/${sessionId}/resume`, {
      method: 'POST'
    });
  }

  // ===========================
  // ML ANALYSIS ENDPOINTS
  // ===========================
  
   // Analyze image using backend ML models (with detailed logging)
   async analyzeImage(request: MLAnalysisRequest): Promise<ApiResponse<MLAnalysisResult>> {
    try {
      console.log('📤 Sending image for ML analysis...', {
        sessionId: request.sessionId,
        imageSize: request.imageData.length,
        timestamp: request.timestamp
      });
      
      const response = await this.apiCall<MLAnalysisResponse>('/api/analyze-image', {
        method: 'POST',
        body: JSON.stringify(request)
      });

      if (response.success && response.data?.analysis) {
        const analysis = response.data.analysis;
        console.log('📥 ML Analysis successful:', {
          emotion: analysis.emotion.emotion,
          emotionConfidence: Math.round(analysis.emotion.confidence * 100) + '%',
          learningState: analysis.learningState.learningState,
          learningConfidence: Math.round(analysis.learningState.confidence * 100) + '%',
          attentionScore: Math.round(analysis.attentionScore * 100) + '%'
        });
        
        // Log intervention if needed
        if (analysis.intervention?.needed) {
          console.warn('⚠️ Intervention triggered:', analysis.intervention);
        }
        
        return { 
          success: true, 
          data: analysis 
        };
      } else {
        return { 
          success: false, 
          error: response.error || response.data?.error || 'ML analysis failed' 
        };
      }
    } catch (error) {
      console.error('❌ Error in ML analysis:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze image' 
      };
    }
  }

  // Check ML models status
  async checkMLStatus(): Promise<ApiResponse<any>> {
    try {
      const response = await this.apiCall<any>('/api/ml/status');

      if (response.success && response.data) {
        console.log('🤖 ML Status:', response.data);
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.error || 'ML status check failed'
        };
      }
    } catch (error) {
      console.error('Error checking ML status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check ML status' 
      };
    }
  }

  // Get ML data for a session (existing method enhanced)
  async getSessionMLData(sessionId: string, limit: number = 50): Promise<ApiResponse<any[]>> {
    try {
      return await this.apiCall<any[]>(`/api/sessions/${sessionId}/ml-data?limit=${limit}`);
    } catch (error) {
      console.error('Error fetching session ML data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch ML data' 
      };
    }
  }

  // Get interventions for a session (existing method enhanced)
  async getSessionInterventions(sessionId: string): Promise<ApiResponse<any[]>> {
    try {
      return await this.apiCall<any[]>(`/api/sessions/${sessionId}/interventions`);
    } catch (error) {
      console.error('Error fetching interventions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch interventions' 
      };
    }
  }
  

  // ===========================
  // HEALTH CHECK
  // ===========================

  async healthCheck(): Promise<ApiResponse<any>> {
    return this.apiCall<any>('/health');
  }
}

// ===========================
// EXPORT SINGLETON INSTANCE
// ===========================

export const apiService = new ApiService();

// Export types
export type {
  UserRegister,
  UserLogin,
  UserResponse,
  ChildCreate,
  ChildResponse,
  ChildUpdate,
  ApiResponse,
  QuizGenerateRequest,
  Quiz,
  QuizSubmitRequest,
  SessionSettings,
  StudySession,
  SessionAnalytics,
  MLAnalysisRequest, MLAnalysisResult, MLAnalysisResponse
};

// ===========================
// REACT HOOKS FOR API CALLS
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

  const execute = async () => {
    setLoading(true);
    setError(null);

    const result = await apiCall();

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error || 'Unknown error');
    }
    setLoading(false);
  };

  useEffect(() => {
    execute();
  }, dependencies);

  return { data, loading, error, refetch: execute };
};

// Hook for manual API calls (like form submissions)
export const useApiMutation = <T, P = any>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = async (
    apiCall: (params: P) => Promise<ApiResponse<T>>,
    params: P
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    const result = await apiCall(params);

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error || 'Unknown error');
    }
    
    setLoading(false);
    return result;
  };

  return { mutate, loading, error, data };
};