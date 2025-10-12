# CA Law Portal - Setup Instructions

## Quick Setup Guide

### 1. Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ca-law-portal

# AI Services (Required)
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
META_LLAMA_API_KEY=your_meta_llama_api_key_here

# Email Configuration (Required for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_TIMEZONE=Asia/Kolkata
```

### 2. Required Services Setup

#### MongoDB
- Install MongoDB locally or use MongoDB Atlas
- Update MONGODB_URI in .env.local

#### Groq
1. Sign up at https://console.groq.com/
2. Get your API key from the dashboard
3. Add to GROQ_API_KEY in .env.local

#### Gemini (Google AI)
1. Visit https://ai.google.dev/
2. Sign up and create a new project
3. Generate an API key for Gemini
4. Add to GEMINI_API_KEY in .env.local

#### Meta-Llama (for Social Media Automation)
1. Sign up at https://together.ai/ or your preferred Llama provider
2. Get your API key for Llama-3-8b model
3. Add to META_LLAMA_API_KEY in .env.local

#### Email (Gmail)
1. Enable 2-factor authentication
2. Generate an app password
3. Use app password in SMTP_PASS

### 3. Installation & Startup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, start automation
npm run cron
```

### 4. First Run

1. Visit http://localhost:3000
2. Click "View Dashboard"
3. Click "Collect News" to fetch initial data
4. Click "Generate Content" to create AI content
5. Monitor the automation status

### 5. Testing the System

#### Manual News Collection
```bash
curl -X POST http://localhost:3000/api/news/collect
```

#### Generate Exam Questions
```bash
curl -X POST http://localhost:3000/api/content/exam \
  -H "Content-Type: application/json" \
  -d '{"topic": "tax-reform", "difficulty": "intermediate"}'
```

#### Send Test Notification
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "daily_update",
    "title": "Test Notification",
    "message": "Testing the notification system",
    "content": "This is a test notification to verify the system is working.",
    "recipients": [{"email": "your-email@example.com", "name": "Test User", "role": "ceo"}]
  }'
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI format

2. **Groq API Error**
   - Verify API key is valid
   - Check account has sufficient credits

3. **Email Not Sending**
   - Verify SMTP credentials
   - Use app password, not regular password
   - Check Gmail security settings

4. **News Collection Failing**
   - Some RSS feeds may be temporarily unavailable
   - Check network connectivity
   - Verify RSS URLs are accessible

### Performance Optimization

1. **Database Indexing**
   - Indexes are automatically created for optimal performance
   - Monitor query performance in MongoDB

2. **AI Costs**
   - Monitor token usage in Groq dashboard
   - Adjust model selection based on needs (llama3-8b vs llama3-70b vs mixtral)

## Production Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically

### Custom Server
1. Build: `npm run build`
2. Start: `npm start`
3. Use PM2 for process management
4. Set up reverse proxy (nginx)

### Automation Service
- Deploy cron service separately
- Use systemd or PM2 for process management
- Monitor logs for errors

## Security Considerations

1. **Environment Variables**
   - Never commit .env files
   - Use secure secret management in production

2. **API Keys**
   - Rotate keys regularly
   - Use least privilege principle

3. **Database Security**
   - Enable authentication
   - Use connection encryption
   - Regular backups

4. **Email Security**
   - Use app passwords
   - Enable 2FA on email accounts

## Monitoring & Maintenance

### Health Checks
- Automation service includes hourly health checks
- Monitor dashboard for system status
- Set up alerts for critical failures

### Data Backup
- Regular MongoDB backups
- Backup generated content

### Updates
- Regular dependency updates
- Monitor AI model updates
- Update RSS feeds as needed

## Support

For technical support:
- Email: admincontrols@aminutemantechnologies.com
- GitHub Issues: Create detailed issue reports
- Documentation: Refer to README.md for comprehensive details
