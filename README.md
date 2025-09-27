# CA Law Portal - AccountantAI

A comprehensive AI-powered automation platform for Chartered Accountants, featuring automated news collection, content generation, and compliance monitoring. This platform mimics the Zapier workflow you provided but with a robust RAG (Retrieval Augmented Generation) system built on Next.js.

## 🚀 Features

### Core Functionality
- **Automated News Collection**: Daily collection from ANI, Economic Times, ICAI, and LiveMint
- **AI Content Generation**: Automated generation of tax articles, audit checklists, exam questions, SEO content, compliance guides, and loophole analysis
- **Simple AI Pipeline**: Direct API calls to Groq for fast and cost-effective content generation
- **Exam Generation**: Automated creation of ICAI-style exam questions based on latest news
- **Notification System**: Automated email notifications for CEOs and stakeholders
- **Real-time Dashboard**: Comprehensive monitoring and control interface

### AI Capabilities
- **Multi-Model Support**: Groq Llama3-8B, Llama3-70B, and Mixtral-8x7B
- **Smart Categorization**: Automatic categorization of news articles (tax, compliance, audit, general)
- **Impact Assessment**: Intelligent impact scoring (high, medium, low)
- **SEO Optimization**: Automatic SEO scoring and optimization for generated content
- **Compliance Checking**: ICAI compliance validation for all generated content

### Automation Features
- **Scheduled Tasks**: Daily news collection, content generation, and notifications
- **Manual Controls**: On-demand execution of all automation tasks
- **Health Monitoring**: Real-time status monitoring and error handling
- **Configurable Workflows**: Customizable automation schedules and parameters

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose
- **AI Services**: Groq API (Llama3, Mixtral)
- **Automation**: Node-cron
- **Email**: Nodemailer
- **Web Scraping**: Cheerio, Axios, RSS Parser

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB instance
- Groq API key
- SMTP email credentials

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ca-law-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/ca-law-portal
   DATABASE_NAME=ca-law-portal

   # AI Services
   GROQ_API_KEY=your_groq_api_key_here

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password_here

   # News Sources (pre-configured)
   ANI_RSS_URL=https://www.aninews.in/rss/
   ECONOMIC_TIMES_RSS_URL=https://economictimes.indiatimes.com/rssfeeds/1715249553.cms
   ICAI_RSS_URL=https://www.icai.org/rss.xml
   LIVEMINT_RSS_URL=https://www.livemint.com/rss/news

   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000

   # Cron Jobs
   CRON_TIMEZONE=Asia/Kolkata
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Start the automation service** (in a separate terminal)
   ```bash
   npm run cron
   ```

## 📊 Dashboard

Access the comprehensive dashboard at `http://localhost:3000/dashboard` to:
- Monitor news collection and content generation
- View automation status and statistics
- Manually trigger automation tasks
- Generate exam questions for specific topics
- Monitor notification delivery

## 🔧 API Endpoints

### News Collection
- `POST /api/news/collect` - Manually trigger news collection
- `GET /api/news/collect` - Get collected news articles

### Content Generation
- `POST /api/content/generate` - Generate AI content
- `GET /api/content/generate` - Get generated content
- `POST /api/content/exam` - Generate exam questions

### Automation
- `POST /api/automation/run` - Run automation tasks
- `GET /api/automation/run` - Get automation status

### Notifications
- `POST /api/notifications/send` - Send notifications
- `GET /api/notifications/send` - Get notification stats

### Dashboard
- `GET /api/dashboard` - Get dashboard data

## 🤖 Automation Schedule

The platform runs automated tasks on the following schedule:
- **9:00 AM**: Daily news collection from all sources
- **10:00 AM**: AI content generation based on collected news
- **11:00 AM**: Send daily update notifications
- **2:00 PM (Sundays)**: Weekly exam question generation
- **Every Hour**: Health checks and status monitoring

## 📈 Content Types Generated

1. **Tax Articles**: Comprehensive articles on tax reforms and updates
2. **Audit Checklists**: Detailed audit procedures and compliance checklists
3. **Exam Questions**: ICAI-style questions for CA exam preparation
4. **SEO Content**: Optimized content for CA practice marketing
5. **Compliance Guides**: Step-by-step compliance procedures
6. **Loophole Analysis**: Strategic tax planning opportunities

## 🎯 Target Audience

- **Chartered Accountants**: Stay updated with latest regulations and generate client-ready content
- **CA Firms**: Automate content creation and client communication
- **Content Writers**: Access structured, professional content for CA audiences
- **SEO Specialists**: Leverage AI-generated, SEO-optimized content
- **CEOs & Business Owners**: Receive automated compliance and regulatory updates

## 🔒 Compliance & Ethics

- All generated content follows ICAI guidelines and ethical standards
- No aggressive tax avoidance strategies are promoted
- Professional integrity and client best interests are prioritized
- Automated compliance checking ensures regulatory adherence

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Custom Server Deployment
1. Build the application: `npm run build`
2. Start the production server: `npm start`
3. Set up PM2 or similar process manager for the cron service

## 📝 Usage Examples

### Generate Exam Questions
```bash
curl -X POST http://localhost:3000/api/content/exam \
  -H "Content-Type: application/json" \
  -d '{"topic": "tax-reform", "difficulty": "intermediate", "count": 10}'
```

### Trigger News Collection
```bash
curl -X POST http://localhost:3000/api/news/collect
```

### Send Custom Notification
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "breaking_news",
    "title": "New Tax Regulation",
    "message": "Important update for CA practice",
    "content": "Detailed content here...",
    "recipients": [{"email": "admin@example.com", "name": "Admin", "role": "ceo"}]
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: admincontrols@aminutemantechnologies.com
- Create an issue in the GitHub repository

## 🔮 Roadmap

- [ ] Multi-language support for regional CA content
- [ ] Advanced analytics and reporting
- [ ] Integration with popular CA software
- [ ] Mobile application
- [ ] Advanced AI models and fine-tuning
- [ ] Client portal for CA firms
- [ ] Automated social media posting
- [ ] Integration with CRM systems

---

**Built with ❤️ for the Chartered Accountancy community**
