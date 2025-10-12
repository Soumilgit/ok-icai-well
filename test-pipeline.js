// Test script to trigger the LinkedIn content pipeline
const BASE_URL = 'http://localhost:3000';

async function testContentPipeline() {
  console.log('🚀 Testing LinkedIn Content Pipeline...');

  try {
    // 1. Generate content from latest trends
    console.log('\n📊 Step 1: Generating content from trends...');
    const generateResponse = await fetch(`${BASE_URL}/api/linkedin-pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate_content'
      })
    });

    const generateResult = await generateResponse.json();
    console.log('Generation Result:', generateResult);

    if (!generateResult.success) {
      throw new Error('Content generation failed');
    }

    console.log(`✅ Generated ${generateResult.data.postsGenerated} posts from ${generateResult.data.trendsFound} trends`);

    // 2. Check pipeline status
    console.log('\n📋 Step 2: Checking pipeline status...');
    const statusResponse = await fetch(`${BASE_URL}/api/linkedin-pipeline`);
    const statusResult = await statusResponse.json();
    
    console.log('Pipeline Status:', statusResult.data);

    // 3. Get posts for approval
    console.log('\n👀 Step 3: Getting posts for approval...');
    const approvalResponse = await fetch(`${BASE_URL}/api/content-approval?status=pending&limit=5`);
    const approvalResult = await approvalResponse.json();
    
    console.log('Posts awaiting approval:', approvalResult.data.posts.length);
    
    if (approvalResult.data.posts.length > 0) {
      console.log('\n📝 Sample post content:');
      console.log('---');
      console.log(approvalResult.data.posts[0].content);
      console.log('---');
      console.log('Hashtags:', approvalResult.data.posts[0].hashtags);
      console.log('Relevance Score:', approvalResult.data.posts[0].trendData.relevanceScore);
    }

    console.log('\n✅ Pipeline test completed successfully!');
    console.log('\n📖 Next steps:');
    console.log('1. Visit http://localhost:3000/content-approval to review and approve posts');
    console.log('2. Approved posts will be automatically scheduled');
    console.log('3. Scheduled posts will be published to LinkedIn at optimal times');

  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testContentPipeline();
}

module.exports = { testContentPipeline };