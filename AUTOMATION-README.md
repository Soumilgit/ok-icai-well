# 🚀 AccountantAI - Automated System

## 📋 Quick Start

### Option 1: Automatic Startup (Recommended)
```bash
# Double-click or run:
start-automation.bat
# OR
powershell -ExecutionPolicy Bypass -File start-automation.ps1
```

### Option 2: Manual Setup
**Terminal 1 - Development Server:**
```bash
npm run dev
```

**Terminal 2 - Automation Scheduler:**
```bash
node automation-scheduler.js
```

## 🔄 Automated Schedule

| Task | Schedule | Description |
|------|----------|-------------|
| **News Collection** | Every 6 hours | Scrapes ANI, Economic Times, ICAI |
| **Content Generation** | Every 8 hours | Creates CA articles from news |
| **Exam Questions** | Daily at 9 AM | Generates practice questions |
| **Notifications** | Every 4 hours | Sends updates to CEOs/users |
| **Full Pipeline** | Daily at 6 AM | Complete automation cycle |

## 💻 Manual Commands

In the automation terminal, type:

```bash
news      # Run news collection now
content   # Generate content now  
exam      # Generate exam questions now
notify    # Send notifications now
full      # Run complete pipeline now
help      # Show all commands
quit      # Exit scheduler
```

## 🌐 Access Points

- **Dashboard**: http://localhost:3000/dashboard
- **API Status**: http://localhost:3000/api/automation/run
- **News Collection**: http://localhost:3000/api/news/collect

## 🔧 What Happens Automatically

1. **Web Scraping**: Puppeteer crawls news sites for CA-related content
2. **AI Processing**: Qwen3-32B generates articles, exam questions, audit checklists
3. **Content Storage**: Everything saved to MongoDB with proper categorization
4. **Notifications**: Email alerts sent to stakeholders about new content
5. **Exam Generation**: Daily practice questions for CA students
6. **Audit Checklists**: Automated compliance guides based on latest regulations

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.4 with TypeScript
- **AI Model**: Qwen3-32B via Groq API
- **Web Scraping**: Puppeteer + Cheerio
- **Database**: MongoDB with Mongoose
- **Scheduling**: Node-cron
- **Authentication**: Clerk
- **Styling**: Tailwind CSS

## 📊 Monitoring

The automation scheduler provides real-time logs with:
- ✅ Success indicators
- ❌ Error reporting  
- 📊 Performance metrics
- 🕐 Timestamp tracking

## 🚨 Troubleshooting

If something doesn't work:
1. Check both terminals are running
2. Verify MongoDB connection in .env.local
3. Ensure port 3000 is available
4. Check API keys (GROQ_API_KEY, etc.)
5. Review logs in automation terminal

## 📁 Key Files

- `automation-scheduler.js` - Main cron scheduler
- `src/lib/advanced-web-scraper.ts` - Puppeteer web scraping
- `src/lib/automation-tasks.ts` - Individual automation functions  
- `src/app/api/automation/run/route.ts` - API endpoints
- `src/lib/ai-processor.ts` - AI content generation

**Your AccountantAI system is now fully automated! 🎉**