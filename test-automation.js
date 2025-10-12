// Test script for the daily automation system
// Run this to test the web scraping and automation pipeline

const testAutomation = async () => {
  console.log('🚀 Testing Daily Automation Pipeline with Web Scraping...');
  
  try {
    // Test the full automation pipeline
    const response = await fetch('http://localhost:3000/api/automation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task: 'full_pipeline'
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Automation Results:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Automation pipeline completed successfully!');
      console.log(`🕐 Duration: ${result.totalDuration}ms`);
      console.log(`📝 Steps completed: ${result.steps.length}`);
      console.log(`❌ Errors: ${result.errors.length}`);
    } else {
      console.log('❌ Automation pipeline failed');
      console.log('Errors:', result.errors);
    }
    
  } catch (error) {
    console.error('❌ Error running automation test:', error);
  }
};

// Test individual news collection
const testNewsCollection = async () => {
  console.log('📰 Testing News Collection with Web Scraping...');
  
  try {
    const response = await fetch('http://localhost:3000/api/automation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task: 'news_collection'
      })
    });
    
    const result = await response.json();
    console.log('News Collection Result:', result);
    
  } catch (error) {
    console.error('Error testing news collection:', error);
  }
};

// Run tests
const runTests = async () => {
  console.log('🔧 Starting Automation Tests...\n');
  
  // Test 1: News Collection only
  await testNewsCollection();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Full pipeline
  await testAutomation();
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAutomation, testNewsCollection, runTests };
}

// Run if called directly
if (typeof window === 'undefined' && require.main === module) {
  runTests();
}