// Simple test script to check API connectivity
const BASE_URL = 'http://localhost:3000';

async function testBasicAPI() {
  console.log('🔍 Testing basic API connectivity...');

  try {
    // Test a simple endpoint first
    console.log('\n1. Testing basic dashboard API...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard`);
    const dashboardText = await dashboardResponse.text();
    
    console.log('Response Status:', dashboardResponse.status);
    console.log('Response Headers:', Object.fromEntries(dashboardResponse.headers.entries()));
    console.log('Response (first 200 chars):', dashboardText.substring(0, 200));

    if (dashboardResponse.headers.get('content-type')?.includes('application/json')) {
      try {
        const dashboardData = JSON.parse(dashboardText);
        console.log('✅ Dashboard API working, JSON response received');
      } catch (e) {
        console.log('❌ Dashboard API returned malformed JSON');
      }
    } else {
      console.log('❌ Dashboard API returned non-JSON response (likely HTML error page)');
    }

    // Test our LinkedIn pipeline API
    console.log('\n2. Testing LinkedIn pipeline API...');
    const pipelineResponse = await fetch(`${BASE_URL}/api/linkedin-pipeline`);
    const pipelineText = await pipelineResponse.text();
    
    console.log('Pipeline Response Status:', pipelineResponse.status);
    console.log('Pipeline Response (first 200 chars):', pipelineText.substring(0, 200));

    if (pipelineResponse.headers.get('content-type')?.includes('application/json')) {
      try {
        const pipelineData = JSON.parse(pipelineText);
        console.log('✅ LinkedIn Pipeline API working');
        console.log('Pipeline Data:', pipelineData);
      } catch (e) {
        console.log('❌ LinkedIn Pipeline API returned malformed JSON');
      }
    } else {
      console.log('❌ LinkedIn Pipeline API returned HTML instead of JSON');
      console.log('This usually means there\'s a compilation error in the API route');
    }

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server connection refused. Please ensure:');
      console.log('   1. npm run dev is running');
      console.log('   2. Server is accessible on http://localhost:3000');
      console.log('   3. No firewall blocking the connection');
    }
  }
}

// Test if we can reach the home page
async function testHomePage() {
  try {
    console.log('\n🏠 Testing home page...');
    const response = await fetch(`${BASE_URL}/`);
    console.log('Home page status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Server is running and responsive');
      return true;
    } else {
      console.log('❌ Server returned error status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot reach server:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Running LinkedIn Pipeline Connectivity Tests...\n');
  
  const serverOnline = await testHomePage();
  
  if (serverOnline) {
    await testBasicAPI();
  } else {
    console.log('\n💡 Next steps:');
    console.log('   1. Make sure you ran: npm run dev');
    console.log('   2. Wait for "Ready in X.Xs" message');
    console.log('   3. Check http://localhost:3000 in your browser');
    console.log('   4. Run this test again');
  }
}

// Run the test
main().catch(console.error);