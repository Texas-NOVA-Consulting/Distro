// ============================================
// TASK 2: Prompt Generation Testing
// File: src/prompt-testing.js
// ============================================

require('dotenv').config();
const { PromptTemplate } = require('@langchain/core/prompts');
const { getLLM } = require('./langchain-setup');

/**
 * Test different prompt templates for news summarization
 */
async function testPromptTemplates() {
  console.log('🧪 Testing Prompt Templates for News Summarization...\n');

  const model = getLLM();

  // Sample news article for testing
  const sampleArticle = {
    title: 'Tech Giant Announces Revolutionary AI Chip',
    content: `A major technology company unveiled its latest AI processor today, claiming it can perform complex machine learning tasks 10 times faster than current solutions while using 50% less power. The chip, designed specifically for data centers, features a novel architecture that optimizes neural network computations. Industry analysts suggest this could significantly reduce the cost of running large language models and other AI applications. The company plans to begin shipping the chips to select customers in Q2 2024, with broader availability expected by year-end.`,
    source: 'TechNews Daily',
    publishedAt: '2024-02-10T14:30:00Z',
  };

  // Test 1: Basic Summary Template
  console.log('📝 Test 1: Basic Summary Template');
  console.log('━'.repeat(60));
  const basicTemplate = PromptTemplate.fromTemplate(
    `Summarize this news article in 2-3 sentences:

Title: {title}
Content: {content}`
  );

  const basicPrompt = await basicTemplate.format({
    title: sampleArticle.title,
    content: sampleArticle.content,
  });
  const basicResponse = await model.invoke(basicPrompt);
  console.log('Prompt:', basicPrompt);
  console.log('\nResponse:', basicResponse.content);
  console.log('\n');

  // Test 2: Structured Summary Template
  console.log('📋 Test 2: Structured Summary Template');
  console.log('━'.repeat(60));
  const structuredTemplate = PromptTemplate.fromTemplate(
    `Analyze this news article and provide a structured summary:

Title: {title}
Content: {content}

Please provide:
1. Main Point (1 sentence)
2. Key Details (2-3 bullet points)
3. Impact/Significance (1 sentence)`
  );

  const structuredPrompt = await structuredTemplate.format({
    title: sampleArticle.title,
    content: sampleArticle.content,
  });
  const structuredResponse = await model.invoke(structuredPrompt);
  console.log('Response:', structuredResponse.content);
  console.log('\n');

  // Test 3: Audience-Specific Template
  console.log('👥 Test 3: Audience-Specific Template (Tech-Savvy)');
  console.log('━'.repeat(60));
  const audienceTemplate = PromptTemplate.fromTemplate(
    `Summarize this news for a {audience} audience in {tone} tone:

Title: {title}
Content: {content}

Keep it {length} and focus on what matters to {audience}.`
  );

  const audiencePrompt = await audienceTemplate.format({
    title: sampleArticle.title,
    content: sampleArticle.content,
    audience: 'tech-savvy professionals',
    tone: 'professional but engaging',
    length: 'concise (2-3 sentences)',
  });
  const audienceResponse = await model.invoke(audiencePrompt);
  console.log('Response:', audienceResponse.content);
  console.log('\n');

  // Test 4: Clickbait Detection Template
  console.log('🎯 Test 4: Clickbait vs Quality Assessment');
  console.log('━'.repeat(60));
  const qualityTemplate = PromptTemplate.fromTemplate(
    `Analyze this news article:

Title: {title}
Content: {content}

Rate this article on:
1. Clickbait Score (1-10, where 10 is pure clickbait)
2. Information Quality (1-10, where 10 is highly informative)
3. Newsworthiness (1-10, where 10 is highly newsworthy)

Provide brief justification for each score.`
  );

  const qualityPrompt = await qualityTemplate.format({
    title: sampleArticle.title,
    content: sampleArticle.content,
  });
  const qualityResponse = await model.invoke(qualityPrompt);
  console.log('Response:', qualityResponse.content);
  console.log('\n');

  // Test 5: Hashtag Generation Template
  console.log('🏷️  Test 5: Hashtag Generation');
  console.log('━'.repeat(60));
  const hashtagTemplate = PromptTemplate.fromTemplate(
    `Generate 3-5 relevant hashtags for this news article:

Title: {title}
Content: {content}

Format: Return only the hashtags, separated by spaces, like: #AI #Tech #Innovation`
  );

  const hashtagPrompt = await hashtagTemplate.format({
    title: sampleArticle.title,
    content: sampleArticle.content,
  });
  const hashtagResponse = await model.invoke(hashtagPrompt);
  console.log('Response:', hashtagResponse.content);
  console.log('\n');

  console.log('✅ All prompt template tests completed!\n');
  console.log('📊 Summary:');
  console.log('   - Tested 5 different prompt templates');
  console.log('   - All templates successfully generated responses');
  console.log('   - Ready to implement news summarization pipeline\n');
  console.log('📝 Next steps:');
  console.log('   - Choose the best template(s) for your use case');
  console.log('   - Move on to Task 3: News API Integration\n');
}

/**
 * Test prompt with custom article
 */
async function testCustomArticle(title, content) {
  console.log('🔍 Testing Custom Article...\n');

  const model = getLLM();

  const template = PromptTemplate.fromTemplate(
    `Summarize this news article in 2-3 engaging sentences:

Title: {title}
Content: {content}`
  );

  const prompt = await template.format({ title, content });
  const response = await model.invoke(prompt);

  console.log('Summary:', response.content);
  console.log('\n');

  return response.content;
}

// Run tests if executed directly
if (require.main === module) {
  testPromptTemplates().catch((error) => {
    console.error('❌ Error during prompt testing:', error.message);
    process.exit(1);
  });
}

module.exports = { testPromptTemplates, testCustomArticle };
