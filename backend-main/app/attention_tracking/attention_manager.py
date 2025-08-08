# app/attention_tracking/attention_manager.py
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AttentionManager:
    """Manages attention tracking and intervention decisions"""
    
    def __init__(self):
        self.sessions = {}  # session_id -> session data
        
        # Configurable thresholds
        self.config = {
            'quiz_cooldown_minutes': 3,
            'low_attention_threshold': 0.4,
            'medium_attention_threshold': 0.6,
            'high_attention_threshold': 0.8,
            'history_window_size': 5,
            'boredom_trigger_count': 2,
            'confusion_duration_threshold': 60,  # seconds
            'trend_calculation_window': 3
        }
    
    def initialize_session(self, session_id: str) -> None:
        """Initialize tracking for a new session"""
        self.sessions[session_id] = {
            'history': [],
            'last_quiz_time': None,
            'quiz_count': 0,
            'start_time': datetime.now(),
            'current_state': 'monitoring',
            'intervention_log': []
        }
        logger.info(f"Initialized attention tracking for session {session_id}")
    
    def add_analysis(self, session_id: str, analysis_data: Dict) -> Dict:
        """Add new ML analysis and determine next actions"""
        if session_id not in self.sessions:
            self.initialize_session(session_id)
        
        session = self.sessions[session_id]
        
        # Store analysis with timestamp
        entry = {
            'timestamp': datetime.now(),
            'attention_score': analysis_data['attentionScore'],
            'emotion': analysis_data['emotion']['emotion'],
            'emotion_confidence': analysis_data['emotion']['confidence'],
            'learning_state': analysis_data['learningState']['learningState'],
            'learning_confidence': analysis_data['learningState']['confidence']
        }
        
        session['history'].append(entry)
        
        # Keep only recent history
        max_history = self.config['history_window_size']
        session['history'] = session['history'][-max_history:]
        
        # Calculate metrics
        attention_trend = self._calculate_attention_trend(session['history'])
        avg_attention = self._calculate_average_attention(session['history'])
        state_summary = self._analyze_learning_states(session['history'])
        
        # Determine next sampling interval
        next_interval = self._calculate_next_interval(
            entry['attention_score'], 
            attention_trend
        )
        
        # Check for interventions
        intervention = self._check_intervention_needed(
            session, 
            entry, 
            attention_trend, 
            state_summary
        )
        
        # Log if intervention triggered
        if intervention['needed']:
            session['intervention_log'].append({
                'timestamp': datetime.now(),
                'type': intervention['type'],
                'reason': intervention['reason']
            })
            session['last_quiz_time'] = datetime.now()
        
        return {
            'next_sample_interval': next_interval,
            'intervention': intervention,
            'metrics': {
                'current_attention': entry['attention_score'],
                'average_attention': avg_attention,
                'attention_trend': attention_trend,
                'dominant_state': state_summary['dominant'],
                'session_duration': (datetime.now() - session['start_time']).seconds
            }
        }
    
    def _calculate_attention_trend(self, history: List[Dict]) -> str:
        """Calculate if attention is improving, declining, or stable"""
        if len(history) < 3:
            return 'stable'
        
        window = self.config['trend_calculation_window']
        recent = history[-window:]
        
        scores = [h['attention_score'] for h in recent]
        
        # Simple linear trend
        if scores[-1] > scores[0] + 0.1:
            return 'improving'
        elif scores[-1] < scores[0] - 0.1:
            return 'declining'
        else:
            return 'stable'
    
    def _calculate_average_attention(self, history: List[Dict]) -> float:
        """Calculate rolling average attention score"""
        if not history:
            return 0.5
        
        scores = [h['attention_score'] for h in history[-3:]]
        return sum(scores) / len(scores)
    
    def _analyze_learning_states(self, history: List[Dict]) -> Dict:
        """Analyze distribution of learning states"""
        if not history:
            return {'dominant': 'unknown', 'counts': {}}
        
        recent = history[-3:]  # Last 3 readings
        states = [h['learning_state'] for h in recent]
        
        # Count occurrences
        state_counts = {}
        for state in states:
            state_counts[state] = state_counts.get(state, 0) + 1
        
        # Find dominant state
        dominant = max(state_counts.items(), key=lambda x: x[1])[0]
        
        return {
            'dominant': dominant,
            'counts': state_counts,
            'boredom_count': state_counts.get('boredom', 0),
            'confusion_count': state_counts.get('confusion', 0)
        }
    
    def _calculate_next_interval(self, current_attention: float, trend: str) -> int:
        """Determine next sampling interval in seconds"""
        base_intervals = {
            'high': 60,      # 1 minute when engaged
            'medium': 30,    # 30 seconds normal
            'low': 15        # 15 seconds when struggling
        }
        
        # Determine base interval
        if current_attention >= self.config['high_attention_threshold']:
            interval = base_intervals['high']
        elif current_attention >= self.config['medium_attention_threshold']:
            interval = base_intervals['medium']
        else:
            interval = base_intervals['low']
        
        # Adjust based on trend
        if trend == 'declining' and interval > 15:
            interval = int(interval * 0.7)  # Sample more frequently
        elif trend == 'improving' and interval < 60:
            interval = int(interval * 1.3)  # Sample less frequently
        
        return interval
    
    def _check_intervention_needed(self, session: Dict, current: Dict, 
                                   trend: str, state_summary: Dict) -> Dict:
        """Determine if intervention is needed and what type"""
        
        # Default: no intervention
        intervention = {
            'needed': False,
            'type': None,
            'reason': None,
            'urgency': 'low',
            'confidence': 0
        }
        
        # Check cooldown
        if session['last_quiz_time']:
            time_since_quiz = (datetime.now() - session['last_quiz_time']).seconds
            cooldown_seconds = self.config['quiz_cooldown_minutes'] * 60
            
            if time_since_quiz < cooldown_seconds:
                return intervention
        
        # Priority 1: High boredom with low attention
        if (state_summary['boredom_count'] >= self.config['boredom_trigger_count'] and
            current['attention_score'] < self.config['medium_attention_threshold']):
            
            return {
                'needed': True,
                'type': 'engaging_quiz',
                'reason': 'Child appears bored and disengaged',
                'urgency': 'high',
                'confidence': current['learning_confidence']
            }
        
        # Priority 2: Sustained confusion
        confusion_duration = self._check_sustained_state(session['history'], 'confusion')
        if confusion_duration > self.config['confusion_duration_threshold']:
            return {
                'needed': True,
                'type': 'helpful_hint',
                'reason': 'Child has been confused for over a minute',
                'urgency': 'medium',
                'confidence': 0.8
            }
        
        # Priority 3: Declining attention trend
        if (trend == 'declining' and 
            current['attention_score'] < self.config['medium_attention_threshold'] and
            len(session['history']) >= 3):
            
            return {
                'needed': True,
                'type': 'attention_check',
                'reason': 'Attention has been declining',
                'urgency': 'medium',
                'confidence': 0.7
            }
        
        # Priority 4: Frustration detection
        if (current['learning_state'] == 'frustration' and 
            current['emotion'] in ['angry', 'sad'] and
            current['learning_confidence'] > 0.7):
            
            return {
                'needed': True,
                'type': 'break_suggestion',
                'reason': 'Child appears frustrated and upset',
                'urgency': 'high',
                'confidence': current['learning_confidence']
            }
        
        return intervention
    
    def _check_sustained_state(self, history: List[Dict], state: str) -> int:
        """Check how long a state has been sustained (in seconds)"""
        if not history:
            return 0
        
        duration = 0
        for i in range(len(history) - 1, -1, -1):
            if history[i]['learning_state'] == state:
                if i == 0:
                    duration = (datetime.now() - history[0]['timestamp']).seconds
                else:
                    duration = (datetime.now() - history[i]['timestamp']).seconds
            else:
                break
        
        return duration
    
    def get_session_summary(self, session_id: str) -> Optional[Dict]:
        """Get summary statistics for a session"""
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        history = session['history']
        
        if not history:
            return None
        
        attention_scores = [h['attention_score'] for h in history]
        
        return {
            'session_duration': (datetime.now() - session['start_time']).seconds,
            'average_attention': sum(attention_scores) / len(attention_scores),
            'min_attention': min(attention_scores),
            'max_attention': max(attention_scores),
            'quiz_count': session['quiz_count'],
            'intervention_count': len(session['intervention_log']),
            'dominant_emotion': self._get_dominant_emotion(history),
            'dominant_learning_state': self._get_dominant_learning_state(history)
        }
    
    def _get_dominant_emotion(self, history: List[Dict]) -> str:
        """Find most common emotion in history"""
        emotions = [h['emotion'] for h in history]
        return max(set(emotions), key=emotions.count) if emotions else 'unknown'
    
    def _get_dominant_learning_state(self, history: List[Dict]) -> str:
        """Find most common learning state in history"""
        states = [h['learning_state'] for h in history]
        return max(set(states), key=states.count) if states else 'unknown'

# Singleton instance
attention_manager = AttentionManager()