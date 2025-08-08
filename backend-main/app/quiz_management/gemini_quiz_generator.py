# app/quiz_management/gemini_quiz_generator.py
import google.generativeai as genai
import json
import logging
from typing import Dict, Any, Optional
import asyncio
from datetime import datetime

from ..settings import settings

logger = logging.getLogger(__name__)

class GeminiQuizGenerator:
    def __init__(self):
        """Initialize Gemini API for quiz generation"""
        self.api_key = settings.GEMINI_API_KEY
        self.model = None
        self.initialized = False
        
        if self.api_key:
            self._initialize_gemini()
        else:
            logger.warning("⚠️ Gemini API key not found. Quiz generation will fail.")
    
    def _initialize_gemini(self):
        """Initialize Gemini model"""
        try:
            genai.configure(api_key=self.api_key)
            
            # Using gemini-1.5-flash for free tier (15 RPM limit)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            
            self.initialized = True
            logger.info("✅ Gemini API initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini: {str(e)}")
            self.initialized = False
    
    def _build_quiz_prompt(self, 
                          subject: str, 
                          age: int, 
                          attention_state: Dict[str, Any],
                          session_context: Dict[str, Any]) -> str:
        """Build dynamic prompt based on child's current state"""
        
        # Determine approach based on learning state
        learning_state = attention_state.get('learning_state', 'neutral')
        attention_score = attention_state.get('attention_score', 0.5)
        
        # Base prompt structure
        prompt = f"""You are an expert educational content creator for children aged 8-10.

Create ONE engaging quiz question for a {age} year old child studying {subject}.

Current Context:
- The child is currently: {learning_state}
- Attention level: {int(attention_score * 100)}%
- They've been studying for: {session_context.get('duration_minutes', 0)} minutes

"""
        
        # Add state-specific instructions
        if learning_state == 'boredom' or attention_score < 0.4:
            prompt += """
IMPORTANT: The child is BORED! Make this quiz:
- Super fun and game-like
- Use a story or scenario
- Include emojis in the question
- Make it feel like playing, not studying
- Keep it short and exciting
"""
        
        elif learning_state == 'confusion':
            prompt += """
IMPORTANT: The child is CONFUSED! Make this quiz:
- Very clear and simple
- Break down concepts step by step
- Use everyday examples they know
- Guide them to understanding
- Encouraging and supportive
"""
        
        elif learning_state == 'frustration':
            prompt += """
IMPORTANT: The child is FRUSTRATED! Make this quiz:
- Extra easy to rebuild confidence
- Celebrate what they know
- Very encouraging tone
- Focus on success
- Include positive reinforcement
"""
        
        elif learning_state == 'engagement' or attention_score > 0.7:
            prompt += """
IMPORTANT: The child is ENGAGED! Make this quiz:
- Challenging but achievable
- Thought-provoking
- Include a fun fact or "did you know?"
- Reward their focus with interesting content
"""
        
        # Subject-specific examples
        subject_examples = {
            'mathematics': "addition, subtraction, shapes, counting, word problems",
            'reading': "vocabulary, comprehension, phonics, sight words",
            'science': "animals, plants, weather, simple experiments, human body",
            'writing': "spelling, sentence structure, creative prompts",
            'history': "famous people, important events, cultures, traditions",
            'art': "colors, shapes, famous artists, techniques"
        }
        
        prompt += f"""
Topic ideas for {subject}: {subject_examples.get(subject.lower(), 'general knowledge')}

Output Format (JSON only, no other text):
{{
    "question": "The quiz question here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "hint": "A helpful hint if they're stuck",
    "explanation": "Why this answer is correct (revealed after answering)",
    "fun_fact": "An interesting related fact (optional)"
}}

Requirements:
- Exactly 4 multiple choice options
- correct_index must be 0, 1, 2, or 3
- Age-appropriate language
- Clear and unambiguous
- Educational value
"""
        
        return prompt
    
    async def generate_quiz(self, 
                           subject: str,
                           child_age: int,
                           attention_state: Dict[str, Any],
                           session_context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a quiz question using Gemini"""
        
        if not self.initialized:
            raise Exception("Gemini API not initialized. Check API key.")
        
        try:
            # Build the prompt
            prompt = self._build_quiz_prompt(subject, child_age, attention_state, session_context)
            
            logger.info(f"🤖 Generating {attention_state.get('learning_state', 'normal')} quiz for {subject}")
            
            # Generate content (synchronous call wrapped in async)
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                self.model.generate_content,
                prompt
            )
            
            # Parse the response
            response_text = response.text.strip()
            
            # Clean up response (remove markdown if present)
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Parse JSON
            quiz_data = json.loads(response_text)
            
            # Validate the response
            self._validate_quiz_data(quiz_data)
            
            # Add metadata
            quiz_data['generated_at'] = datetime.utcnow().isoformat()
            quiz_data['subject'] = subject
            quiz_data['difficulty'] = self._get_difficulty_level(attention_state)
            quiz_data['quiz_id'] = f"gemini_{int(datetime.utcnow().timestamp())}"
            
            # Calculate XP reward based on difficulty
            quiz_data['xp_reward'] = self._calculate_xp_reward(attention_state)
            
            logger.info(f"✅ Quiz generated successfully: {quiz_data['question'][:50]}...")
            
            return quiz_data
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse Gemini response: {str(e)}")
            raise Exception("Invalid response format from AI")
            
        except Exception as e:
            logger.error(f"❌ Quiz generation failed: {str(e)}")
            raise
    
    def _validate_quiz_data(self, quiz_data: Dict[str, Any]) -> None:
        """Validate that quiz data has all required fields"""
        required_fields = ['question', 'options', 'correct_index', 'hint', 'explanation']
        
        for field in required_fields:
            if field not in quiz_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate options
        if not isinstance(quiz_data['options'], list) or len(quiz_data['options']) != 4:
            raise ValueError("Options must be a list of exactly 4 items")
        
        # Validate correct_index
        if not isinstance(quiz_data['correct_index'], int) or quiz_data['correct_index'] not in [0, 1, 2, 3]:
            raise ValueError("correct_index must be 0, 1, 2, or 3")
        
        # Ensure all text fields are strings
        for field in ['question', 'hint', 'explanation']:
            if not isinstance(quiz_data[field], str):
                raise ValueError(f"{field} must be a string")
    
    def _get_difficulty_level(self, attention_state: Dict[str, Any]) -> str:
        """Determine difficulty based on attention state"""
        attention_score = attention_state.get('attention_score', 0.5)
        learning_state = attention_state.get('learning_state', 'neutral')
        
        if learning_state in ['frustration', 'confusion'] or attention_score < 0.3:
            return 'easy'
        elif learning_state == 'engagement' and attention_score > 0.7:
            return 'hard'
        else:
            return 'medium'
    
    def _calculate_xp_reward(self, attention_state: Dict[str, Any]) -> int:
        """Calculate XP reward based on difficulty and state"""
        difficulty = self._get_difficulty_level(attention_state)
        
        base_xp = {
            'easy': 5,
            'medium': 10,
            'hard': 15
        }
        
        # Bonus XP for overcoming negative states
        learning_state = attention_state.get('learning_state', 'neutral')
        if learning_state in ['boredom', 'frustration', 'confusion']:
            return base_xp[difficulty] + 5  # Encouragement bonus
        
        return base_xp[difficulty]

# Singleton instance
gemini_quiz_generator = GeminiQuizGenerator()