const cron = require('node-cron');
const fetch = require('node-fetch');

// Configuration
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const AUTOMATION_ENDPOINT = `${BASE_URL}/api/automation/run`;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${new Date().toISOString()} - ${message}${colors.reset}`);
};

// Function to make API calls
async function runAutomationTask(task, additionalData = {}) {
  try {
    log(`🔄 Starting ${task}...`, colors.blue);
    
    const response = await fetch(AUTOMATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task,
        ...additionalData
      })
    });

    const result = await response.json();
    
    if (result.success) {
      log(`✅ ${task} completed successfully!`, colors.green);
      if (result.articlesCollected) {
        log(`📰 Articles collected: ${result.articlesCollected}`, colors.cyan);
      }
      if (result.contentGenerated) {
        log(`📝 Content generated: ${result.contentGenerated}`, colors.cyan);
      }
      if (result.notificationsSent) {
        log(`📧 Notifications sent: ${result.notificationsSent}`, colors.cyan);
      }
    } else {
      log(`❌ ${task} failed: ${result.error}`, colors.red);
    }
    
    return result;
  } catch (error) {
    log(`❌ Error running ${task}: ${error.message}`, colors.red);
    return { success: false, error: error.message };
  }
}

// Cron job schedules
log('🚀 Starting AccountantAI Automation Scheduler...', colors.green);

// 1. News Collection - Every 6 hours
cron.schedule('0 */6 * * *', async () => {
  log('📰 Running scheduled news collection...', colors.yellow);
  await runAutomationTask('news_collection');
});

// 2. Content Generation - Every 8 hours  
cron.schedule('0 */8 * * *', async () => {
  log('📝 Running scheduled content generation...', colors.yellow);
  await runAutomationTask('content_generation', { 
    topic: 'Daily CA Updates' 
  });
});

// 3. Exam Generation - Daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  log('📚 Running scheduled exam generation...', colors.yellow);
  await runAutomationTask('exam_generation', { 
    topic: 'Tax Law Updates',
    difficulty: 'intermediate' 
  });
});

// 4. Notifications - Every 4 hours
cron.schedule('0 */4 * * *', async () => {
  log('📧 Running scheduled notifications...', colors.yellow);
  await runAutomationTask('notifications');
});

// 5. Full Pipeline - Daily at 6 AM
cron.schedule('0 6 * * *', async () => {
  log('🔄 Running full automation pipeline...', colors.yellow);
  await runAutomationTask('full_pipeline');
});

// Manual trigger functions for testing
async function runNow(task) {
  log(`🚀 Manual trigger: ${task}`, colors.cyan);
  return await runAutomationTask(task);
}

// Test all systems on startup (after 30 seconds)
setTimeout(async () => {
  log('🧪 Running startup test...', colors.cyan);
  await runAutomationTask('news_collection');
}, 30000);

// Manual controls
process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    const command = chunk.trim().toLowerCase();
    
    switch (command) {
      case 'news':
        runNow('news_collection');
        break;
      case 'content':
        runNow('content_generation');
        break;
      case 'exam':
        runNow('exam_generation');
        break;
      case 'notify':
        runNow('notifications');
        break;
      case 'full':
        runNow('full_pipeline');
        break;
      case 'help':
        console.log(`
${colors.cyan}📋 Available Commands:${colors.reset}
- news     : Run news collection
- content  : Run content generation  
- exam     : Run exam generation
- notify   : Run notifications
- full     : Run full pipeline
- help     : Show this help
- quit     : Exit scheduler
        `);
        break;
      case 'quit':
      case 'exit':
        log('👋 Shutting down automation scheduler...', colors.yellow);
        process.exit(0);
        break;
      default:
        if (command) {
          log(`❓ Unknown command: ${command}. Type 'help' for available commands.`, colors.red);
        }
    }
  }
});

log('⏰ Cron jobs scheduled:', colors.green);
log('  📰 News Collection: Every 6 hours', colors.cyan);
log('  📝 Content Generation: Every 8 hours', colors.cyan);
log('  📚 Exam Generation: Daily at 9 AM', colors.cyan);
log('  📧 Notifications: Every 4 hours', colors.cyan);
log('  🔄 Full Pipeline: Daily at 6 AM', colors.cyan);
log('', colors.reset);
log('💡 Type commands: news, content, exam, notify, full, help, quit', colors.yellow);
log('✅ Automation scheduler is running...', colors.green);