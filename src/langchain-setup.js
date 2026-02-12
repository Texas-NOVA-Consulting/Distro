// ============================================
// TASK 1: LangChain Development Environment Setup
// File: src/langchain-setup.js
// ============================================

LANGCHAIN_CALLBACKS_BACKGROUND=true

require('dotenv').config();
const { PromptTemplate } = require('@langchain/core/prompts');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

/**
 * Get the LLM (using Gemini)
 */
function getLLM() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY not found in .env file');
  }

  return new ChatGoogleGenerativeAI({
    modelName: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

/**
 * Test basic LangChain setup
 */
async function testBasicSetup() {
  console.log('🔧 Testing LangChain environment setup...\n');

  // 1. Check environment variables
  console.log('1️⃣ Checking environment configuration...');
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('❌ GOOGLE_API_KEY not found in .env file');
  }
  console.log('✅ Gemini API key configured\n');

  // 2. Initialize LLM
  console.log('2️⃣ Initializing Gemini model...');
  const model = getLLM();
  console.log('✅ Model initialized: gemini-2.5-flash-lite\n');

  // 3. Test a simple prompt
  console.log('3️⃣ Testing simple prompt...');
  const response = await model.invoke('Say "Hello from LangChain!"');
  console.log('   Response:', response.content);
  console.log('✅ Simple prompt works\n');

  // 4. Test prompt template
  console.log('4️⃣ Testing prompt template...');
  const template = PromptTemplate.fromTemplate(
    'Summarize this news headline in one sentence: {headline}'
  );
  const formattedPrompt = await template.format({
    headline: 'Breaking: AI transforms news industry',
  });
  console.log('   Formatted prompt:', formattedPrompt);
  const templateResponse = await model.invoke(formattedPrompt);
  console.log('   Template response:', templateResponse.content);
  console.log('✅ Prompt template works\n');

  // 5. Test news API configuration
  console.log('5️⃣ Testing news API configuration...');
  if (process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'your-news-api-key-here') {
    console.log('✅ News API key configured\n');
  } else {
    console.log('⚠️  News API key not configured yet\n');
  }

  console.log('🎉 All tests passed! LangChain environment is set up correctly.');
  console.log('\n📝 Next steps:');
  console.log('   - Move on to Task 2: Prompt Generation Testing\n');
}

// Run the test
if (require.main === module) {
  testBasicSetup().catch((error) => {
    console.error('❌ Error during setup test:', error.message);
    process.exit(1);
  });
}

module.exports = { testBasicSetup, getLLM };
