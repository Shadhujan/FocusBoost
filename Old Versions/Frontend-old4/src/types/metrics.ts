export interface EmotionMetrics {
  happy: number;       // 0–100
  neutral: number;
  distracted: number;
}

export interface AttentionSample {
  timestamp: string;   // ISO string
  attentionScore: number;  // 0–100
  emotions: EmotionMetrics;
}

export interface AttentionMetricsPayload {
  sessionId: string;
  childId: string;
  samples: AttentionSample[];
}

export interface AttentionMetricsResponse extends AttentionMetricsPayload {
  id: string;
  createdAt: string;   // ISO
}
