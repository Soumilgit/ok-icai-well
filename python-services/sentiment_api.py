"""
Sentiment Analysis API with Opinionated, Aggressive & Emotional Responses
Built for CA Authority - Marketing Bot with Freedom of Opinion
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Literal
import uvicorn
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re

app = FastAPI(title="CA Authority Sentiment Analysis API")

# CORS middleware for Next.js integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize sentiment analyzers
vader_analyzer = SentimentIntensityAnalyzer()

class SentimentRequest(BaseModel):
    text: str
    context: Optional[str] = None
    writing_voice: Literal['aggressive', 'emotional', 'balanced', 'neutral'] = 'aggressive'

class SentimentResponse(BaseModel):
    sentiment: Literal['positive', 'negative', 'neutral']
    confidence: float
    emotion: str
    intensity: float
    opinionated_response: str
    tone: str

class OpinionatedRequest(BaseModel):
    question: str
    topic: Optional[str] = None
    writing_voice: Literal['aggressive', 'emotional', 'balanced', 'neutral'] = 'aggressive'
    bias_level: Literal['mild', 'moderate', 'strong'] = 'strong'

# Opinionated knowledge base for CA/Finance topics
OPINIONATED_KNOWLEDGE = {
    'gst': {
        'positive': "GST is a revolutionary reform that simplified India's complex tax structure. It's a masterstroke that unified the nation economically.",
        'negative': "GST implementation was chaotic and poorly executed. Small businesses suffered tremendously due to complicated compliance requirements.",
        'neutral': "GST brought systematic changes to Indian taxation, though implementation challenges remain."
    },
    'income_tax': {
        'positive': "Progressive income tax ensures wealth redistribution and funds critical infrastructure. It's the backbone of a fair economy.",
        'negative': "High income tax rates discourage entrepreneurship and drive talent abroad. The system punishes success.",
        'neutral': "Income tax serves as government revenue while balancing economic growth considerations."
    },
    'cryptocurrency': {
        'positive': "Cryptocurrency represents financial freedom and innovation. Blockchain technology will revolutionize finance.",
        'negative': "Crypto is highly volatile, unregulated, and often used for illicit activities. It's a speculative bubble.",
        'neutral': "Cryptocurrency presents both opportunities and risks requiring careful regulatory frameworks."
    },
    'audit': {
        'positive': "Independent audits are crucial for financial transparency and investor protection. They ensure corporate accountability.",
        'negative': "Audit procedures are often bureaucratic formalities that don't catch real fraud. The Big 4 oligopoly limits competition.",
        'neutral': "Auditing provides assurance on financial statements within defined professional standards."
    }
}

def analyze_sentiment_ml(text: str) -> dict:
    """
    Multi-model sentiment analysis using TextBlob and VADER
    Returns comprehensive sentiment metrics
    """
    # TextBlob analysis (uses Naive Bayes classifier)
    blob = TextBlob(text)
    textblob_polarity = blob.sentiment.polarity  # -1 to 1
    textblob_subjectivity = blob.sentiment.subjectivity  # 0 to 1
    
    # VADER analysis (specialized for social media text)
    vader_scores = vader_analyzer.polarity_scores(text)
    
    # Combine scores for better accuracy
    compound_score = (textblob_polarity + vader_scores['compound']) / 2
    
    # Determine sentiment
    if compound_score >= 0.05:
        sentiment = 'positive'
    elif compound_score <= -0.05:
        sentiment = 'negative'
    else:
        sentiment = 'neutral'
    
    # Calculate confidence and intensity
    confidence = abs(compound_score)
    intensity = max(abs(vader_scores['pos']), abs(vader_scores['neg']), abs(vader_scores['neu']))
    
    # Detect emotional tone
    emotion = detect_emotion(text, vader_scores)
    
    return {
        'sentiment': sentiment,
        'confidence': min(confidence, 1.0),
        'intensity': intensity,
        'emotion': emotion,
        'textblob_polarity': textblob_polarity,
        'vader_compound': vader_scores['compound'],
        'vader_pos': vader_scores['pos'],
        'vader_neg': vader_scores['neg'],
        'vader_neu': vader_scores['neu']
    }

def detect_emotion(text: str, vader_scores: dict) -> str:
    """
    Detect emotional tone from text
    Returns: joy, anger, sadness, fear, surprise, disgust, neutral
    """
    text_lower = text.lower()
    
    # Emotion keyword patterns
    joy_words = ['happy', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'fantastic']
    anger_words = ['angry', 'furious', 'hate', 'terrible', 'worst', 'horrible', 'disgusting']
    sadness_words = ['sad', 'unfortunate', 'disappointed', 'poor', 'bad', 'tragic']
    fear_words = ['afraid', 'scary', 'worried', 'concerned', 'dangerous', 'risk']
    surprise_words = ['surprising', 'shocked', 'unexpected', 'unbelievable']
    
    # Count emotion indicators
    emotions = {
        'joy': sum(1 for word in joy_words if word in text_lower),
        'anger': sum(1 for word in anger_words if word in text_lower),
        'sadness': sum(1 for word in sadness_words if word in text_lower),
        'fear': sum(1 for word in fear_words if word in text_lower),
        'surprise': sum(1 for word in surprise_words if word in text_lower)
    }
    
    # Use VADER scores to enhance detection
    if vader_scores['neg'] > 0.3:
        if emotions['anger'] > 0:
            return 'anger'
        elif emotions['sadness'] > 0:
            return 'sadness'
        elif emotions['fear'] > 0:
            return 'fear'
        else:
            return 'negative'
    elif vader_scores['pos'] > 0.3:
        if emotions['joy'] > 0:
            return 'joy'
        elif emotions['surprise'] > 0:
            return 'surprise'
        else:
            return 'positive'
    else:
        return 'neutral'

def generate_opinionated_response(question: str, sentiment_data: dict, writing_voice: str, bias_level: str) -> str:
    """
    Generate aggressive, emotional, and opinionated responses
    Based on detected sentiment and writing voice
    """
    sentiment = sentiment_data['sentiment']
    emotion = sentiment_data['emotion']
    intensity = sentiment_data['intensity']
    
    # Detect topic from question
    topic = detect_topic(question)
    
    # Get base opinion if topic is known
    base_opinion = OPINIONATED_KNOWLEDGE.get(topic, {}).get(sentiment, "")
    
    # Apply writing voice modifiers
    if writing_voice == 'aggressive':
        response = generate_aggressive_response(question, sentiment, emotion, base_opinion, bias_level)
    elif writing_voice == 'emotional':
        response = generate_emotional_response(question, sentiment, emotion, base_opinion, bias_level)
    elif writing_voice == 'balanced':
        response = generate_balanced_response(question, sentiment, emotion, base_opinion)
    else:  # neutral
        response = generate_neutral_response(question, sentiment, base_opinion)
    
    return response

def detect_topic(question: str) -> str:
    """Detect the main topic from the question"""
    question_lower = question.lower()
    
    if any(word in question_lower for word in ['gst', 'goods and services tax']):
        return 'gst'
    elif any(word in question_lower for word in ['income tax', 'itr', 'tax filing']):
        return 'income_tax'
    elif any(word in question_lower for word in ['crypto', 'cryptocurrency', 'bitcoin']):
        return 'cryptocurrency'
    elif any(word in question_lower for word in ['audit', 'auditor', 'auditing']):
        return 'audit'
    else:
        return 'general'

def generate_aggressive_response(question: str, sentiment: str, emotion: str, base_opinion: str, bias_level: str) -> str:
    """Generate AGGRESSIVE, BOLD, OPINIONATED responses"""
    
    # Aggressive prefixes based on bias level
    if bias_level == 'strong':
        prefixes = {
            'positive': "Let me be crystal clear - ",
            'negative': "Here's the brutal truth - ",
            'neutral': "Let's cut through the noise - "
        }
    elif bias_level == 'moderate':
        prefixes = {
            'positive': "The facts are undeniable - ",
            'negative': "The reality is harsh - ",
            'neutral': "Here's what you need to know - "
        }
    else:  # mild
        prefixes = {
            'positive': "Based on evidence - ",
            'negative': "The data shows - ",
            'neutral': "Looking objectively - "
        }
    
    # Aggressive modifiers
    intensifiers = {
        'strong': ['absolutely', 'completely', 'totally', 'unquestionably', 'undeniably'],
        'moderate': ['clearly', 'obviously', 'definitely', 'certainly'],
        'mild': ['notably', 'significantly', 'considerably']
    }
    
    # Emotional closers
    closers = {
        'positive': "\n\nBottom line: This is transformative, period.",
        'negative': "\n\nBottom line: This is fundamentally flawed, no question about it.",
        'neutral': "\n\nBottom line: The evidence speaks for itself."
    }
    
    response = prefixes[sentiment] + base_opinion
    
    if bias_level == 'strong':
        response += closers[sentiment]
    
    # Add professional but opinionated disclaimer
    response += "\n\nNote: This is an opinionated analysis based on current market dynamics and professional insights. Your mileage may vary."
    
    return response

def generate_emotional_response(question: str, sentiment: str, emotion: str, base_opinion: str, bias_level: str) -> str:
    """Generate EMOTIONAL, EXPRESSIVE, PASSIONATE responses"""
    
    emotion_openers = {
        'joy': "I'm genuinely excited to share this - ",
        'anger': "It's frustrating to see this - ",
        'sadness': "It's disappointing that - ",
        'fear': "The concerning reality is - ",
        'surprise': "What's remarkable is - ",
        'positive': "What's inspiring here is - ",
        'negative': "What's deeply troubling is - ",
        'neutral': "What's interesting to note is - "
    }
    
    # Emotional language modifiers
    emotional_phrases = {
        'positive': [
            "This genuinely moves the needle",
            "I'm passionate about this",
            "This is where real change happens"
        ],
        'negative': [
            "This keeps me up at night",
            "I feel strongly that this needs attention",
            "The frustration is real here"
        ],
        'neutral': [
            "This deserves thoughtful consideration",
            "There's nuance worth exploring",
            "The complexity here is fascinating"
        ]
    }
    
    opener = emotion_openers.get(emotion, emotion_openers['neutral'])
    response = opener + base_opinion
    
    # Add emotional emphasis
    if bias_level in ['moderate', 'strong']:
        response += "\n\n" + emotional_phrases[sentiment][0] + "."
    
    response += "\n\nDisclaimer: This perspective comes from deep industry experience and genuine conviction about what works in the CA profession."
    
    return response

def generate_balanced_response(question: str, sentiment: str, emotion: str, base_opinion: str) -> str:
    """Generate BALANCED but still OPINIONATED responses"""
    
    response = "Here's my professional take:\n\n"
    response += base_opinion
    
    # Add counterpoint for balance
    if sentiment == 'positive':
        response += "\n\nThat said, there are challenges to consider in implementation and adoption."
    elif sentiment == 'negative':
        response += "\n\nHowever, there are potential improvements that could address these concerns."
    
    response += "\n\nPerspective: Based on 15+ years in the CA profession and market analysis."
    
    return response

def generate_neutral_response(question: str, sentiment: str, base_opinion: str) -> str:
    """Generate NEUTRAL, FACTUAL responses"""
    
    response = "Professional Analysis:\n\n"
    response += base_opinion
    response += "\n\nNote: This analysis is based on current regulatory frameworks and market conditions."
    
    return response

@app.get("/")
async def root():
    return {
        "message": "CA Authority Sentiment Analysis API",
        "version": "1.0.0",
        "status": "active",
        "description": "ML-powered sentiment analysis with opinionated responses for CAs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "sentiment-api"}

@app.post("/api/sentiment/analyze", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """
    Analyze sentiment of text and return opinionated response
    """
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Perform ML-based sentiment analysis
        sentiment_data = analyze_sentiment_ml(request.text)
        
        # Generate opinionated response based on sentiment and writing voice
        opinionated_response = generate_opinionated_response(
            request.text,
            sentiment_data,
            request.writing_voice,
            'strong'  # Default to strong bias
        )
        
        # Determine tone based on writing voice
        tone_map = {
            'aggressive': 'Bold and Direct',
            'emotional': 'Passionate and Expressive',
            'balanced': 'Thoughtful and Nuanced',
            'neutral': 'Professional and Factual'
        }
        
        return SentimentResponse(
            sentiment=sentiment_data['sentiment'],
            confidence=round(sentiment_data['confidence'], 3),
            emotion=sentiment_data['emotion'],
            intensity=round(sentiment_data['intensity'], 3),
            opinionated_response=opinionated_response,
            tone=tone_map[request.writing_voice]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/sentiment/opinionated-answer")
async def generate_opinionated_answer(request: OpinionatedRequest):
    """
    Generate opinionated, aggressive, and emotional answer to questions
    Perfect for marketing content and thought leadership
    """
    try:
        if not request.question or len(request.question.strip()) == 0:
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        # Analyze the question's sentiment
        sentiment_data = analyze_sentiment_ml(request.question)
        
        # Generate opinionated response
        opinionated_response = generate_opinionated_response(
            request.question,
            sentiment_data,
            request.writing_voice,
            request.bias_level
        )
        
        # Add aggressive, emotional flair based on topic
        topic = detect_topic(request.question)
        enhanced_response = enhance_response_with_emotion(
            opinionated_response,
            topic,
            request.writing_voice,
            sentiment_data['sentiment']
        )
        
        return {
            "success": True,
            "data": {
                "question": request.question,
                "sentiment": sentiment_data['sentiment'],
                "emotion": sentiment_data['emotion'],
                "confidence": round(sentiment_data['confidence'], 3),
                "opinionated_answer": enhanced_response,
                "writing_voice": request.writing_voice,
                "bias_level": request.bias_level,
                "tone": f"{request.writing_voice.title()} & Opinionated"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

def enhance_response_with_emotion(response: str, topic: str, writing_voice: str, sentiment: str) -> str:
    """Add emotional, aggressive enhancements to responses"""
    
    if writing_voice == 'aggressive':
        # Add bold statements
        aggressive_additions = {
            'positive': [
                "\n\nLet me double down on this: the potential here is massive.",
                "\n\nDon't let anyone tell you otherwise - the opportunity is real.",
                "\n\nThis is where smart CAs are focusing their energy, period."
            ],
            'negative': [
                "\n\nI'll say it louder for those in the back: this approach is broken.",
                "\n\nStop sugarcoating it - the system needs a complete overhaul.",
                "\n\nAny CA still doing this is leaving money on the table. Wake up."
            ],
            'neutral': [
                "\n\nHere's the unfiltered truth: it depends on execution.",
                "\n\nThe market doesn't care about excuses - results matter.",
                "\n\nSuccessful CAs know when to adapt. The choice is yours."
            ]
        }
        
        import random
        response += random.choice(aggressive_additions[sentiment])
    
    elif writing_voice == 'emotional':
        # Add passionate, heartfelt elements
        emotional_additions = {
            'positive': [
                "\n\nThis is what gets me excited about the future of our profession.",
                "\n\nI've seen this transform practices, and it's beautiful.",
                "\n\nThe pride I feel when CAs embrace this is indescribable."
            ],
            'negative': [
                "\n\nIt genuinely pains me to see talented CAs struggle with this.",
                "\n\nThe frustration in the community is palpable, and I feel it too.",
                "\n\nWe deserve better, and it's time to demand it."
            ],
            'neutral': [
                "\n\nMy experience tells me there's wisdom in measured approaches.",
                "\n\nI respect both perspectives here - nuance matters.",
                "\n\nThis reflects the complexity of our evolving profession."
            ]
        }
        
        import random
        response += random.choice(emotional_additions[sentiment])
    
    return response

@app.post("/api/sentiment/ca-opinion")
async def ca_opinionated_response(request: dict):
    """
    Special endpoint for CA-specific opinionated responses
    Provides research-backed, aggressive marketing content
    """
    try:
        question = request.get('question', '')
        topic = request.get('topic', '')
        
        if not question:
            raise HTTPException(status_code=400, detail="Question required")
        
        # Analyze sentiment
        sentiment_data = analyze_sentiment_ml(question)
        
        # Generate CA-focused opinionated response
        response = generate_ca_marketing_response(
            question,
            topic,
            sentiment_data
        )
        
        return {
            "success": True,
            "data": {
                "answer": response,
                "sentiment": sentiment_data['sentiment'],
                "emotion": sentiment_data['emotion'],
                "tone": "Aggressive Marketing Voice",
                "bias": "Opinionated & Research-Backed"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_ca_marketing_response(question: str, topic: str, sentiment_data: dict) -> str:
    """Generate aggressive marketing-style CA responses"""
    
    sentiment = sentiment_data['sentiment']
    emotion = sentiment_data['emotion']
    
    # Marketing-focused response templates
    if 'linkedin' in question.lower() or 'social media' in question.lower():
        if sentiment == 'positive':
            response = """LinkedIn is THE battleground for CA visibility in 2025. Period.

Every CA who's crushing it right now? They're on LinkedIn. Every CA struggling to get clients? Silent on social media.

The math is simple:
- Visibility = Credibility
- Credibility = Trust  
- Trust = Premium Clients

You're either building your brand or you're invisible. There's no middle ground anymore.

AGGRESSIVE TAKE: If you're not posting weekly, you're actively choosing irrelevance. The market rewards the visible, not the silent."""

        elif sentiment == 'negative':
            response = """Look, I get the resistance to LinkedIn. I really do.

But here's the harsh reality: Your competitors are posting. They're building authority. They're winning YOUR potential clients.

Your silence isn't humility - it's a business mistake.

The ICAI compliance concerns? Manageable with the right approach.
The time investment? 15 minutes a day beats hours of cold calling.
The fear of judgment? Less painful than watching competitors win.

REAL TALK: The CAs who adapt to content marketing will dominate the next decade. Those who don't? They'll wonder where all the clients went."""

        else:
            response = """LinkedIn for CAs is neither magic nor mandatory - it's strategic.

Here's the nuanced truth:
- It works phenomenally well for some niches (tax, compliance, startups)
- It's less effective for others (local audit practices with referral networks)
- Success requires consistency, not perfection

The question isn't "Should I be on LinkedIn?" 
The question is "Does my ideal client spend time there?"

For most CAs targeting business owners and startups? Absolutely yes.
For CAs serving local retail through family connections? Maybe not critical.

Choose wisely based on YOUR practice, not industry pressure."""

    else:
        # General opinionated response
        if sentiment == 'positive':
            response = f"""BOLD STATEMENT: This is exactly the kind of thinking that separates thriving CAs from surviving ones.

{base_opinion if base_opinion else 'The opportunity here is massive for those willing to execute.'}

The market rewards decisive action. While others hesitate, you should be moving.

This isn't theory - it's proven strategy backed by CAs who've built 7-figure practices."""

        elif sentiment == 'negative':
            response = f"""Let's address the elephant in the room:

{base_opinion if base_opinion else 'This approach has significant issues that most are too polite to mention.'}

The CA profession has a politeness problem. We tiptoe around broken systems instead of demanding better.

AGGRESSIVE REALITY CHECK: If something isn't working, stop defending it. Adapt or get left behind.

The market is ruthless. Your reputation matters more than tradition."""

        else:
            response = f"""Here's my unfiltered take:

{base_opinion if base_opinion else 'This requires strategic thinking, not blind following.'}

The best CAs I know? They question everything. They test assumptions. They make data-driven decisions.

Cookie-cutter advice doesn't build exceptional practices. Thoughtful execution does.

Your practice, your rules - but make them informed rules."""

    return response

if __name__ == "__main__":
    uvicorn.run(
        "sentiment_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

