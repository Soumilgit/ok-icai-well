const cron = require('node-cron');
const axios = require('axios');

// Set timezone
process.env.TZ = process.env.CRON_TIMEZONE || 'Asia/Kolkata';

console.log('🚀 Starting CA Law Portal Automation Service...');
console.log('🌏 Timezone:', process.env.TZ);
console.log('📡 API Base URL:', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Helper function to make API calls
async function makeAPICall(endpoint, data = null) {
  try {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const config = {
      method: data ? 'POST' : 'GET',
      url,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.data = data;
    }
    
    console.log(`🔄 Making API call to: ${endpoint}`);
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ API call failed for ${endpoint}:`, error.message);
    throw error;
  }
}

// Comprehensive daily automation at 9 AM IST
cron.schedule('0 9 * * *', async () => {
  console.log('🌅 Running comprehensive daily CA Law automation...');
  console.log('📅 Date:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  
  try {
    // Run the complete daily automation pipeline
    const result = await makeAPICall('/automation/run', {
      task: 'daily-automation',
      timestamp: new Date().toISOString(),
      sources: ['ANI', 'Economic Times', 'ICAI'],
      automated: true
    });
    
    console.log('✅ Daily automation completed successfully!');
    console.log('📊 Results:', JSON.stringify(result, null, 2));
    
    // Log summary
    if (result.success && result.data) {
      console.log(`📰 News collected: ${result.data.news?.length || 0} articles`);
      console.log(`📝 Content generated: ${result.data.content?.length || 0} pieces`);
      console.log(`✅ Audit checklists: ${result.data.audit?.length || 0} created`);
      console.log(`❓ Exam questions: ${result.data.exam?.length || 0} generated`);
      console.log(`📧 Notifications sent: ${result.data.notifications?.length || 0} emails`);
    }
    
  } catch (error) {
    console.error('❌ Error in daily automation:', error.message);
    
    // Try to send error notification
    try {
      await makeAPICall('/notifications/send', {
        type: 'error',
        title: 'Daily Automation Failed',
        message: `Daily automation failed at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}: ${error.message}`,
        recipients: [
          { email: 'admincontrols@aminutemantechnologies.com', name: 'Admin', role: 'ceo' }
        ],
        priority: 'high'
      });
    } catch (notificationError) {
      console.error('❌ Failed to send error notification:', notificationError.message);
    }
  }
}, {
  scheduled: true,
  timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata'
});

// Weekly summary email on Sundays at 10 AM
cron.schedule('0 10 * * 0', async () => {
  console.log('📊 Running weekly summary generation...');
  
  try {
    const result = await makeAPICall('/automation/run', {
      task: 'weekly-summary',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Weekly summary completed:', result.message);
  } catch (error) {
    console.error('❌ Error in weekly summary:', error.message);
  }
}, {
  scheduled: true,
  timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata'
});

// Hourly health check
cron.schedule('0 * * * *', async () => {
  try {
    const result = await makeAPICall('/dashboard');
    console.log('💚 Health check passed at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  } catch (error) {
    console.error('💔 Health check failed:', error.message);
  }
}, {
  scheduled: true,
  timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata'
});

// Manual trigger for immediate automation (for testing)
if (process.argv.includes('--run-now')) {
  console.log('⚡ Running automation immediately (manual trigger)...');
  setTimeout(async () => {
    try {
      const result = await makeAPICall('/automation/run', {
        task: 'daily-automation',
        timestamp: new Date().toISOString(),
        manual: true
      });
      
      console.log('✅ Manual automation completed:', result);
      process.exit(0);
    } catch (error) {
      console.error('❌ Manual automation failed:', error.message);
      process.exit(1);
    }
  }, 2000);
}
// Emergency content generation trigger (every 4 hours if main automation fails)
cron.schedule('0 */4 * * *', async () => {
  console.log('🔄 Running backup content generation check...');
  
  try {
    // Check if we have recent content
    const dashboardData = await makeAPICall('/dashboard');
    
    if (dashboardData.success && dashboardData.data) {
      const recentContentCount = dashboardData.data.overview?.today?.generatedContent || 0;
      
      // If no content generated today, run emergency generation
      if (recentContentCount === 0) {
        console.log('⚠️ No content generated today, running emergency generation...');
        
        const result = await makeAPICall('/automation/run', {
          task: 'emergency-content-generation',
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Emergency content generation completed:', result);
      } else {
        console.log(`✅ Content generation check passed (${recentContentCount} items generated today)`);
      }
    }
  } catch (error) {
    console.error('❌ Error in backup content generation:', error.message);
  }
}, {
  scheduled: true,
  timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata'
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Startup message
console.log('✅ CA Law Portal Automation Service is running!');
console.log('📅 Daily automation scheduled for 9:00 AM IST');
console.log('📊 Weekly summaries scheduled for Sundays at 10:00 AM IST');
console.log('💚 Health checks running every hour');
console.log('🔄 Backup checks running every 4 hours');
console.log('');
console.log('To run automation immediately: node scripts/cron.js --run-now');
console.log('To stop the service: Ctrl+C');
console.log('');

// Daily notifications at 11 AM
cron.schedule('0 11 * * *', async () => {
  console.log('Running daily notifications...');
  try {
    const result = await makeAPICall('/notifications/send', {
      type: 'daily_update',
      title: `Daily CA Law Update - ${new Date().toLocaleDateString()}`,
      message: 'Your daily CA law and compliance update is ready.',
      content: 'Please check the dashboard for the latest updates.',
      recipients: [
        { email: 'admincontrols@aminutemantechnologies.com', name: 'Admin', role: 'ceo' }
      ],
      priority: 'medium'
    });
    console.log('Daily notifications sent:', result.message);
  } catch (error) {
    console.error('Error in daily notifications:', error.message);
  }
}, {
  scheduled: true,
  timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata'
});

// Weekly exam generation on Sundays at 2 PM
cron.schedule('0 14 * * 0', async () => {
  console.log('Running weekly exam generation...');
  try {
    const topics = ['tax-reform', 'gst', 'compliance', 'audit'];
    const difficulties = ['basic', 'intermediate', 'advanced'];
    
    for (const topic of topics) {
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      
      const result = await makeAPICall('/content/exam', {
        topic: topic,
        difficulty: difficulty,
        count: 10
      });
      
      console.log(`Generated exam for ${topic} (${difficulty}):`, result.message);
      
      // Wait 2 minutes between exam generations
      await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
    }
    
    console.log('Weekly exam generation completed successfully');
  } catch (error) {
    console.error('Error in weekly exam generation:', error.message);
  }
}, {
  scheduled: true,
  timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata'
});

// Health check every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running health check...');
  try {
    const status = await makeAPICall('/automation/run');
    console.log('Automation Status:', JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Error in health check:', error.message);
  }
}, {
  scheduled: true,
  timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata'
});

console.log('Cron jobs scheduled successfully');
console.log('Daily news collection: 9:00 AM');
console.log('Daily content generation: 10:00 AM');
console.log('Daily notifications: 11:00 AM');
console.log('Weekly exam generation: Sunday 2:00 PM');
console.log('Health checks: Every hour');
console.log(`API Base URL: ${API_BASE_URL}`);

// Keep the process running
process.on('SIGINT', () => {
  console.log('Shutting down automation service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down automation service...');
  process.exit(0);
});
