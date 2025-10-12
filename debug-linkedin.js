// LinkedIn Posting Debug Tool
const BASE_URL = 'http://localhost:3000';

async function debugLinkedInPosting() {
  console.log('🔍 LinkedIn Posting Debug Analysis...\n');

  try {
    // Step 1: Check if posts are being generated
    console.log('1. Testing content generation...');
    const generateResponse = await fetch(`${BASE_URL}/api/linkedin-pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate_content' })
    });
    
    const generateResult = await generateResponse.json();
    console.log('✅ Generation result:', generateResult.success ? 'SUCCESS' : 'FAILED');
    if (generateResult.data) {
      console.log(`   Posts generated: ${generateResult.data.postsGenerated}`);
    }

    // Step 2: Check if there are pending posts for approval
    console.log('\n2. Checking pending posts...');
    const pendingResponse = await fetch(`${BASE_URL}/api/content-approval?status=pending`);
    const pendingResult = await pendingResponse.json();
    console.log('✅ Pending posts:', pendingResult.success ? pendingResult.data.posts.length : 'ERROR');
    
    if (pendingResult.success && pendingResult.data.posts.length > 0) {
      const firstPost = pendingResult.data.posts[0];
      console.log(`   Sample post: "${firstPost.content.substring(0, 100)}..."`);
      
      // Step 3: Auto-approve the first post for testing
      console.log('\n3. Auto-approving first post for testing...');
      const approveResponse = await fetch(`${BASE_URL}/api/content-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          postId: firstPost.id,
          scheduledFor: new Date(Date.now() + 60000).toISOString() // Schedule for 1 minute from now
        })
      });
      
      const approveResult = await approveResponse.json();
      console.log('✅ Approval result:', approveResult.success ? 'SUCCESS' : 'FAILED');
    }

    // Step 4: Check approved posts
    console.log('\n4. Checking approved posts...');
    const approvedResponse = await fetch(`${BASE_URL}/api/content-approval?status=approved`);
    const approvedResult = await approvedResponse.json();
    console.log('✅ Approved posts:', approvedResult.success ? approvedResult.data.posts.length : 'ERROR');

    // Step 5: Check LinkedIn authentication status
    console.log('\n5. Checking LinkedIn authentication...');
    console.log('   Environment variables:');
    console.log('   - LINKEDIN_ACCESS_TOKEN:', process.env.LINKEDIN_ACCESS_TOKEN ? 'SET' : 'NOT SET');
    console.log('   - LINKEDIN_CLIENT_ID:', process.env.LINKEDIN_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('   - LINKEDIN_CLIENT_SECRET:', process.env.LINKEDIN_CLIENT_SECRET ? 'SET' : 'NOT SET');

    // Step 6: Manual LinkedIn post test
    console.log('\n6. Testing manual LinkedIn post...');
    const testPostData = {
      text: 'Test post from AccountantAI - LinkedIn automation working! 🚀',
      hashtags: ['#TestPost', '#CharteredAccountant', '#Automation']
    };

    // Create a simple LinkedIn service test
    console.log('   📝 Test post content:', testPostData.text);
    console.log('   🏷️ Test hashtags:', testPostData.hashtags.join(' '));

    // Check if we can create a mock LinkedIn post
    if (!process.env.LINKEDIN_ACCESS_TOKEN) {
      console.log('   ❌ Cannot test actual LinkedIn posting - no access token');
      console.log('   💡 To enable LinkedIn posting:');
      console.log('      1. Add LINKEDIN_ACCESS_TOKEN to .env.local');
      console.log('      2. Add LINKEDIN_CLIENT_ID to .env.local');
      console.log('      3. Add LINKEDIN_CLIENT_SECRET to .env.local');
      console.log('      4. Complete LinkedIn OAuth flow');
    } else {
      console.log('   ✅ LinkedIn access token is configured');
      console.log('   💡 Posting should work if token is valid');
    }

    // Step 7: Check scheduling system
    console.log('\n7. Testing scheduling system...');
    const scheduleResponse = await fetch(`${BASE_URL}/api/linkedin-pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'schedule_approved' })
    });
    
    const scheduleResult = await scheduleResponse.json();
    console.log('✅ Scheduling result:', scheduleResult.success ? 'SUCCESS' : 'FAILED');
    if (scheduleResult.data) {
      console.log(`   Posts scheduled: ${scheduleResult.data.postsScheduled || 0}`);
    }

    // Summary
    console.log('\n📊 DEBUGGING SUMMARY:');
    console.log('===================');
    console.log('✅ Content Generation:', generateResult.success ? 'WORKING' : 'BROKEN');
    console.log('✅ Content Approval System:', pendingResult.success ? 'WORKING' : 'BROKEN');
    console.log('✅ Post Scheduling:', scheduleResult.success ? 'WORKING' : 'BROKEN');
    console.log('✅ LinkedIn Auth:', process.env.LINKEDIN_ACCESS_TOKEN ? 'CONFIGURED' : 'MISSING');
    
    console.log('\n🎯 NEXT STEPS:');
    if (!process.env.LINKEDIN_ACCESS_TOKEN) {
      console.log('1. 🔑 Configure LinkedIn authentication');
      console.log('2. ✅ Set up OAuth flow in .env.local');
      console.log('3. 🚀 Test posting again');
    } else {
      console.log('1. ✅ Authentication looks good');
      console.log('2. 🕐 Check if scheduled posts are being processed');
      console.log('3. 📱 Verify posts appear on your LinkedIn profile');
    }

  } catch (error) {
    console.error('❌ Debug analysis failed:', error.message);
  }
}

// Run the debug analysis
debugLinkedInPosting().catch(console.error);