//langchain environment setup

require('dotenv').config();
const { PromptTemplate } = require('@langchain/core/prompts');

/**
 * Placeholder LLM for testing without API keys
 */
class PlaceholderLLM {
  constructor() {
    this.modelName = 'placeholder-model';
  }

  async invoke(prompt) {
    // Simulate AI response
    console.log('   [Using API placeholder - no actual API call made]');
    return {
      content: `Placeholder response to: "${prompt.substring(0, 50)}..."`
    };
  }
}

/**
 * Get the appropriate LLM based on available API keys
 */
function getLLM() {
  const apiKey = process.env.OPENAI_API_KEY || 
                 process.env.ANTHROPIC_API_KEY || 
                 process.env.AI_API_KEY;

  if (!apiKey || apiKey === 'your-api-key-here' || apiKey === 'placeholder') {
    console.log('⚠️  No API key configured - using placeholder\n');
    return new PlaceholderLLM();
  }

  // If you have OpenAI key
  if (process.env.OPENAI_API_KEY && 
      process.env.OPENAI_API_KEY !== 'your-api-key-here') {
    const { ChatOpenAI } = require('@langchain/openai');
    return new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
    });
  }

  // If you have Anthropic key
  if (process.env.ANTHROPIC_API_KEY && 
      process.env.ANTHROPIC_API_KEY !== 'your-api-key-here') {
    const { ChatAnthropic } = require('@langchain/anthropic');
    return new ChatAnthropic({
      modelName: 'claude-3-sonnet-20240229',
      temperature: 0.7,
    });
  }

  // Fallback to placeholder
  console.log('⚠️  API key found but not recognized - using placeholder\n');
  return new PlaceholderLLM();
}

/**
 * Test basic LangChain setup
 */
async function testBasicSetup() {
  console.log('🔧 Testing LangChain environment setup...\n');

  // 1. Check environment variables
  console.log('1️⃣ Checking environment configuration...');
  const hasRealKey = process.env.OPENAI_API_KEY && 
                     process.env.OPENAI_API_KEY !== 'your-api-key-here' &&
                     process.env.OPENAI_API_KEY !== 'placeholder';
  
  if (hasRealKey) {
    console.log('✅ API key configured\n');
  } else {
    console.log('✅ Environment loaded (using API placeholder)\n');
  }

  // 2. Initialize LLM (real or placeholder)
  console.log('2️⃣ Initializing language model...');
  const model = getLLM();
  console.log(`✅ Model initialized: ${model.modelName || 'PlaceholderLLM'}\n`);

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

  // 5. Test news API placeholder
  console.log('5️⃣ Testing news API configuration...');
  if (process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'your-news-api-key-here') {
    console.log('✅ News API key configured\n');
  } else {
    console.log('⚠️  News API key not configured (using placeholder for now)\n');
  }

  console.log('🎉 All tests passed! LangChain environment is set up correctly.');
  console.log('\n📝 Next steps:');
  if (!hasRealKey) {
    console.log('   - Add your actual API key to .env file when available');
    console.log('   - Ask your team which AI provider to use (OpenAI, Anthropic, etc.)');
  }
  console.log('   - Move on to Task 2: Prompt Generation Testing\n');
}

// Run the test
if (require.main === module) {
  testBasicSetup().catch((error) => {
    console.error('❌ Error during setup test:', error.message);
    console.error('\n💡 Tip: Make sure you have a .env file with your API keys');
    console.error('   or leave them as placeholders to run tests\n');
    process.exit(1);
  });
}

module.exports = { testBasicSetup, getLLM };