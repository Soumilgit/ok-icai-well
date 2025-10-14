# Quick Start Guide - Sentiment Analysis Opinionated AI

## 🚀 Get Started in 3 Steps

### Step 1: Install Python Dependencies (One-time setup)

**Open PowerShell/Terminal and run:**

```bash
cd C:\Users\Soumil\Downloads\AccountantAI-main\python-services
pip install -r requirements.txt
python setup_nltk.py
```

**Expected time:** 2-3 minutes

---

### Step 2: Start Sentiment Service

**Keep PowerShell/Terminal open and run:**

```bash
python sentiment_api.py
```

**OR use the convenient script:**

```bash
# Windows
.\start-sentiment-service.ps1

# Linux/Mac/WSL
bash start-sentiment-service.sh
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**✅ Keep this terminal window open!** The service must run in the background.

---

### Step 3: Start Next.js (In NEW Terminal)

**Open a NEW terminal window and run:**

```bash
cd C:\Users\Soumil\Downloads\AccountantAI-main
taskkill /f /im node.exe
npm run dev
```

**You should see:**
```
✓ Ready in Xs
- Local: http://localhost:3000
```

---

## 🔥 Using Opinionated AI

### Access the Feature:

1. Open **http://localhost:3000/dashboard**
2. Sign in to your account
3. Click **"AI Chat"** tab (in left sidebar)
4. Click **"🔥 Opinionated AI"** button

### Try These Questions:

#### Marketing & Strategy
```
Should CAs focus on LinkedIn or cold calling?
Is traditional CA practice dead?
How can I get premium clients?
```

#### Tax & Compliance  
```
Is GST implementation good or bad?
Are income tax rates fair?
Should CAs advise clients on crypto?
```

#### Professional Development
```
Is audit work still profitable?
Should I specialize or stay general?
Is AI replacing CAs?
```

### What Makes It Different?

**Regular AI Response:**
```
"LinkedIn can be beneficial for CAs when used strategically..."
```

**Opinionated AI Response (Aggressive Mode):**
```
Let me be crystal clear - LinkedIn is THE battleground for CA visibility in 2025. Period.

Every CA who's crushing it right now? They're on LinkedIn.

Your silence isn't humility - it's a business mistake.

Bottom line: If you're not posting weekly, you're actively choosing irrelevance.

Note: This is an opinionated analysis based on current market dynamics.
```

---

## ⚙️ Configuration Options

### Change Writing Voice:

Modify in `src/components/DashboardChatInterface.tsx` line 219:

```typescript
writing_voice: 'aggressive'  // Options: aggressive, emotional, balanced, neutral
```

### Change Bias Level:

```typescript
bias_level: 'strong'  // Options: mild, moderate, strong
```

---

## 🐛 Troubleshooting

### Problem: Port 8000 already in use

**Windows:**
```bash
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

### Problem: Sentiment API not responding

**Check if service is running:**
```bash
curl http://localhost:8000/health
```

**If not running, restart:**
```bash
cd python-services
python sentiment_api.py
```

### Problem: "Module not found" errors

**Reinstall dependencies:**
```bash
cd python-services
pip install -r requirements.txt --force-reinstall
python setup_nltk.py
```

### Problem: Chatbot shows fallback message

This means Python service isn't running. Check:
1. Is `sentiment_api.py` running in a terminal?
2. Can you access http://localhost:8000?
3. Are there errors in the Python terminal?

---

## 📊 How Sentiment Analysis Works

### ML Models Used:

1. **TextBlob (Naive Bayes)**
   - Trained on movie reviews dataset
   - General-purpose sentiment classification
   - Returns polarity (-1 to 1) and subjectivity (0 to 1)

2. **VADER (Valence Aware Dictionary)**
   - Specialized for social media text
   - Handles slang, emoticons, capitalization
   - Returns compound score + positive/negative/neutral breakdown

3. **Combined Scoring**
   - Average of TextBlob + VADER for accuracy
   - Confidence calculated from score magnitude
   - Emotion detected from keyword patterns + VADER scores

### Response Generation:

1. Analyze question sentiment → Detect emotion
2. Identify topic (GST, tax, LinkedIn, etc.)
3. Retrieve opinionated knowledge base entry
4. Apply writing voice (aggressive/emotional/balanced)
5. Add bias level modifiers (mild/moderate/strong)
6. Enhance with emotional/aggressive language
7. Return formatted plain text (no markdown)

---

## 🎯 Use Cases

### 1. Thought Leadership Content
Generate bold opinions for LinkedIn posts that stand out

### 2. Marketing Copy
Create aggressive marketing messages that convert

### 3. Controversial Takes
Develop unique perspectives on industry topics

### 4. Client Education
Explain complex topics with passionate conviction

### 5. Brand Building
Establish strong, memorable professional voice

---

## 🔑 Environment Variables

Add to `.env.local`:

```env
# Sentiment Analysis Service URL
SENTIMENT_API_URL=http://localhost:8000

# Fallback to Gemini if service unavailable
GEMINI_API_KEY=your_gemini_key_here
```

---

## 📈 Next Steps

1. ✅ Test with sample questions
2. 📝 Customize knowledge base for your topics
3. 🎨 Adjust writing voice and bias levels
4. 🚀 Use generated content for LinkedIn posts
5. 📊 Monitor sentiment analytics
6. 🔧 Fine-tune responses based on feedback

---

## 🆘 Need Help?

**Check Service Status:**
```bash
curl http://localhost:8000/
```

**Test Sentiment Analysis:**
```bash
curl -X POST http://localhost:8000/api/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"This is amazing!","writing_voice":"aggressive"}'
```

**View API Documentation:**
```
http://localhost:8000/docs
```

---

**🔥 Ready to unleash opinionated, aggressive, and emotionally charged AI responses!**

