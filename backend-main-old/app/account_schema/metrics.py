from pydantic import BaseModel, Field, constr
from datetime import datetime
from typing import Optional, List


class EmotionMetrics(BaseModel):
    happy:    int = Field(..., ge=0, le=100, description="Percentage 0–100")
    neutral:  int = Field(..., ge=0, le=100)
    distracted: int = Field(..., ge=0, le=100)

    def total(self) -> int:
        return self.happy + self.neutral + self.distracted


class AttentionSample(BaseModel):
    timestamp: datetime = Field(..., description="Exact time of the sample")
    attention_score: int = Field(..., ge=0, le=100, description="0–100 composite attention score")
    emotions: EmotionMetrics


class AttentionMetricsCreate(BaseModel):
    session_id:    constr(min_length=1) = Field(..., description="ID of the focus session")
    child_id:      constr(min_length=1) = Field(..., description="ID of the child")
    samples:       List[AttentionSample] = Field(..., description="Time‐series of raw samples")


class AttentionMetricsResponse(AttentionMetricsCreate):
    id:           str      = Field(..., description="Database record ID")
    created_at:   datetime = Field(..., description="When these metrics were saved")

    class Config:
        orm_mode = True