# Sentiment Analysis ML Service - Setup Guide

## Overview
This guide sets up the **Opinionated AI Chatbot** powered by Machine Learning sentiment analysis using Python FastAPI, TextBlob, and VADER.

## Features
- **ML-Powered Sentiment Analysis**: Uses TextBlob (Naive Bayes) + VADER for accurate sentiment detection
- **Aggressive & Emotional Responses**: Generates bold, opinionated content for marketing
- **Multiple Writing Voices**: Aggressive, Emotional, Balanced, Neutral
- **CA-Specific Knowledge Base**: Pre-loaded with opinions on GST, Income Tax, Crypto, Audit, etc.
- **Bias Levels**: Mild, Moderate, Strong - control opinion intensity
- **Research-Backed**: Professional insights based on CA industry experience

## Prerequisites
- **Python 3.8+** installed
- **pip** package manager
- **Node.js** for Next.js integration
- **Port 8000** available for FastAPI service

## Step 1: Install Python Dependencies

### Windows (PowerShell/CMD):
```bash
cd C:\Users\Soumil\Downloads\AccountantAI-main\python-services
python -m pip install -r requirements.txt
```

### Linux/Mac/WSL:
```bash
cd /path/to/AccountantAI-main/python-services
pip3 install -r requirements.txt
```

## Step 2: Download NLTK Data (Required for TextBlob)

Run the setup script to download required NLTK datasets:

```bash
python setup_nltk.py
```

This will download:
- Brown corpus
- Punkt tokenizer
- WordNet
- Averaged perceptron tagger
- Movie reviews dataset

**Expected output:**
```
Downloading NLTK data...
[nltk_data] Downloading package brown...
[nltk_data] Downloading package punkt...
✅ NLTK data downloaded successfully!
✅ Sentiment analysis service is ready to use
```

## Step 3: Configure Environment Variables

Add to your `.env.local` file:

```env
# Sentiment Analysis Service
SENTIMENT_API_URL=http://localhost:8000
```

## Step 4: Start the FastAPI Sentiment Service

### Option A: Direct Python execution
```bash
cd python-services
python sentiment_api.py
```

### Option B: Using Uvicorn (Recommended for production)
```bash
cd python-services
uvicorn sentiment_api:app --host 0.0.0.0 --port 8000 --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Step 5: Test the Sentiment API

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{"status":"healthy","service":"sentiment-api"}
```

### Test 2: Sentiment Analysis
```bash
curl -X POST http://localhost:8000/api/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"GST is amazing for business","writing_voice":"aggressive"}'
```

### Test 3: Opinionated Answer
```bash
curl -X POST http://localhost:8000/api/sentiment/opinionated-answer \
  -H "Content-Type: application/json" \
  -d '{"question":"Should CAs use LinkedIn?","writing_voice":"aggressive","bias_level":"strong"}'
```

## Step 6: Start Next.js Application

In a **NEW terminal window**:

```bash
cd C:\Users\Soumil\Downloads\AccountantAI-main
npm run dev
```

## Step 7: Access Opinionated AI Mode

1. Navigate to http://localhost:3000/dashboard
2. Click on **"AI Chat"** tab
3. Select **"🔥 Opinionated AI"** mode button
4. Ask any CA-related question

### Example Questions to Try:

**Aggressive Marketing Questions:**
- "Should CAs use LinkedIn for client acquisition?"
- "Is GST compliance too complicated?"
- "Are traditional CAs becoming irrelevant?"
- "Should I invest in crypto as a CA?"
- "Is audit work still profitable in 2025?"

**Opinionated Responses About:**
- LinkedIn strategies
- Tax policy opinions
- Professional branding
- Client acquisition tactics
- Industry controversies

## Writing Voice Options

### 1. **Aggressive** (Default)
- Bold statements
- No-nonsense language
- Direct challenges
- "Let me be crystal clear..."
- "The brutal truth is..."

### 2. **Emotional**
- Passionate expressions
- Personal convictions
- Heartfelt opinions
- "I'm genuinely excited..."
- "It genuinely pains me..."

### 3. **Balanced**
- Thoughtful but opinionated
- Considers counterpoints
- Nuanced takes
- Professional yet strong

### 4. **Neutral**
- Factual and professional
- Minimal bias
- Research-focused

## Bias Levels

### Strong (Default)
- Maximum opinion intensity
- Bold declarative statements
- Clear stance-taking

### Moderate
- Firm but measured
- Evidence-backed opinions

### Mild
- Subtle preferences
- Suggestion-oriented

## API Endpoints

### Sentiment Analysis
```
POST /api/sentiment/analyze
Body: {
  "text": "Your text here",
  "writing_voice": "aggressive",
  "context": "optional context"
}
```

### Opinionated Answer
```
POST /api/sentiment/opinionated-answer
Body: {
  "question": "Your question",
  "writing_voice": "aggressive",
  "bias_level": "strong"
}
```

### CA Opinion
```
POST /api/sentiment/ca-opinion
Body: {
  "question": "Your CA question",
  "topic": "optional topic"
}
```

## Troubleshooting

### Issue: Port 8000 already in use
```bash
# Windows
taskkill /F /IM python.exe

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Issue: NLTK data not found
```bash
python setup_nltk.py
```

### Issue: Module not found errors
```bash
pip install -r requirements.txt --upgrade
```

### Issue: FastAPI service not responding
1. Check if service is running: `curl http://localhost:8000/health`
2. Check logs for errors
3. Restart the service

### Issue: CORS errors in browser
- Ensure FastAPI CORS middleware allows http://localhost:3000
- Check browser console for specific error messages

## How It Works

### 1. Sentiment Detection
- **TextBlob**: Uses Naive Bayes classifier trained on movie reviews
- **VADER**: Optimized for social media and short text
- **Combined Score**: Average of both models for better accuracy

### 2. Emotion Detection
Identifies 7 emotions:
- Joy (positive excitement)
- Anger (negative intensity)
- Sadness (negative subdued)
- Fear (negative concern)
- Surprise (neutral shock)
- Positive (general positive)
- Negative (general negative)

### 3. Opinion Generation
- Analyzes question sentiment
- Detects topic (GST, tax, crypto, audit, etc.)
- Retrieves pre-loaded knowledge base opinion
- Applies writing voice modifiers
- Adds emotional/aggressive enhancements
- Returns formatted clean text response

### 4. Fallback Strategy
If Python service is unavailable:
- Automatically falls back to Gemini API
- Uses aggressive prompt engineering
- Maintains opinionated tone
- Logs fallback usage

## Advanced Configuration

### Custom Knowledge Base

Edit `sentiment_api.py` and update `OPINIONATED_KNOWLEDGE` dictionary:

```python
OPINIONATED_KNOWLEDGE = {
    'your_topic': {
        'positive': "Your positive opinion here",
        'negative': "Your negative opinion here",
        'neutral': "Your balanced take here"
    }
}
```

### Adjust ML Models

Modify sentiment thresholds in `analyze_sentiment_ml()`:

```python
# Current thresholds
if compound_score >= 0.05:  # Positive
elif compound_score <= -0.05:  # Negative
else:  # Neutral

# Make it more sensitive
if compound_score >= 0.02:  # More sensitive to positive
```

### Add Custom Emotions

Extend `detect_emotion()` function with custom keyword lists:

```python
custom_emotion_words = ['excited', 'thrilled', 'pumped']
emotions['custom'] = sum(1 for word in custom_emotion_words if word in text_lower)
```

## Production Deployment

### Docker Setup (Recommended)

Create `Dockerfile` in python-services:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python setup_nltk.py

EXPOSE 8000

CMD ["uvicorn", "sentiment_api:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t sentiment-api ./python-services
docker run -p 8000:8000 sentiment-api
```

### Environment Variables for Production
```env
SENTIMENT_API_URL=https://your-production-api-url.com
```

## Example Usage Scenarios

### Scenario 1: LinkedIn Strategy Question
**Question:** "Should CAs focus on LinkedIn?"

**Response (Aggressive):**
```
Let me be crystal clear - GST is a revolutionary reform that simplified India's complex tax structure.

Bottom line: This is transformative, period.

Let me double down on this: the potential here is massive.

Note: This is an opinionated analysis based on current market dynamics and professional insights.
```

### Scenario 2: Tax Controversy
**Question:** "Are income taxes too high in India?"

**Response (Emotional):**
```
It's deeply troubling that - High income tax rates discourage entrepreneurship and drive talent abroad.

It genuinely pains me to see talented CAs struggle with this.

Disclaimer: This perspective comes from deep industry experience and genuine conviction.
```

## Monitoring & Logs

FastAPI automatically logs all requests. Monitor with:

```bash
# View real-time logs
tail -f sentiment_api.log

# Check specific endpoint usage
grep "opinionated-answer" sentiment_api.log
```

## Support

For issues or questions:
1. Check logs: FastAPI console output
2. Test API directly: Use curl commands above
3. Verify NLTK data: Run `python setup_nltk.py` again
4. Check network: Ensure ports 3000 and 8000 are open

## Credits

- **TextBlob**: MIT License - Natural Language Processing
- **VADER**: MIT License - Sentiment Analysis for Social Media
- **FastAPI**: MIT License - Modern Python Web Framework
- **Research Reference**: Writing Voice analysis templates

---

**🔥 Ready to generate aggressive, opinionated, and emotionally charged content for CAs!**

