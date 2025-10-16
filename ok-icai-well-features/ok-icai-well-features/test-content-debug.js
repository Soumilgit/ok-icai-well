// Test script to debug content generation
const { aiProcessor } = require('./dist/lib/ai-processor');

async function testContentGeneration() {
  try {
    console.log('🧪 Testing Content Generation...');
    
    const query = "GST Updates and New Tax Changes";
    const type = "tax_article";
    
    console.log(`Query: ${query}`);
    console.log(`Type: ${type}`);
    
    // Test the simple content generation
    const content = await aiProcessor.generateSimpleContent(query, type);
    
    console.log('\n📝 Generated Content:');
    console.log('Title:', content.title);
    console.log('Type:', content.type);
    console.log('Content Length:', content.content.length);
    console.log('Content Preview (first 500 chars):');
    console.log(content.content.substring(0, 500) + '...');
    
    // Check for think tags
    const hasThinkTags = content.content.includes('<think>') || content.content.includes('<thinking>');
    console.log('\n🔍 Think Tags Check:');
    console.log('Contains <think> tags:', hasThinkTags);
    
    if (hasThinkTags) {
      console.log('❌ PROBLEM: Content still contains think tags!');
      console.log('Full content with think tags:');
      console.log(content.content);
    } else {
      console.log('✅ Content is clean - no think tags found');
    }
    
    console.log('\n📊 Metadata:');
    console.log('Word Count:', content.metadata.wordCount);
    console.log('Reading Time:', content.metadata.readingTime);
    console.log('Tags:', content.metadata.tags);
    
  } catch (error) {
    console.error('❌ Error testing content generation:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testContentGeneration().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});