const testQuestions = [
  {
    testNum: 1,
    title: 'Test 1: Relevant Question',
    question: 'What services does HavenKey provide?',
    expected: 'Answer based on company policy document listing services',
  },
  {
    testNum: 2,
    title: 'Test 2: Tenant Responsibilities',
    question: 'What are the responsibilities of a tenant?',
    expected: 'Answer based on tenant responsibilities section',
  },
  {
    testNum: 3,
    title: 'Test 3: Refund Policy (Missing Information)',
    question: "What is HavenKey's refund policy?",
    expected: 'Fallback indicating information is not found in documents',
  },
  {
    testNum: 4,
    title: 'Test 4: Ask same question twice (Part A)',
    question: 'What happens after submitting a complaint?',
    expected: 'Complaint review steps',
  },
  {
    testNum: 4.1,
    title: 'Test 4: Ask same question twice (Part B - consistency & warm inference check)',
    question: 'What happens after submitting a complaint?',
    expected: 'Same consistent complaint review steps',
  },
  {
    testNum: 5,
    title: 'Test 5: Unrelated Question',
    question: 'What is the recipe for chocolate chip cookies and the capital of France?',
    expected: 'Fallback indicating information is not found without hallucinating real estate policies',
  },
];

async function runTests() {
  console.log('=== HavenKey Local Qwen2.5-0.5B-Instruct RAG Verification Suite ===\n');

  const results = [];

  for (const t of testQuestions) {
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[${t.title}]`);
    console.log(`Question: "${t.question}"`);

    const start = Date.now();
    try {
      const res = await fetch('http://localhost:3000/api/ai/company-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: t.question }),
      });

      const totalReqTime = Date.now() - start;
      const data = await res.json();

      console.log(`Status: ${res.status}`);
      console.log(`Grounded: ${data.grounded}`);
      console.log(`Retrieved Chunks Count: ${data.retrievedCount}`);
      console.log(`Answer:\n${data.answer}`);
      if (data.timing) {
        console.log(`Timing Details: Init: ${data.timing.initTimeMs ?? 0} ms | Inference: ${data.timing.inferenceTimeMs} ms | Total HTTP: ${totalReqTime} ms`);
      } else {
        console.log(`Total HTTP Time: ${totalReqTime} ms`);
      }
      if (data.sources && data.sources.length > 0) {
        console.log(`Sources: ${JSON.stringify(data.sources)}`);
      }

      results.push({
        testNum: t.testNum,
        title: t.title,
        question: t.question,
        grounded: data.grounded,
        answer: data.answer,
        timing: data.timing,
        totalReqTime,
        success: data.success,
      });
    } catch (err) {
      console.error(`Error executing test:`, err.message);
    }
    console.log('');
  }

  console.log('=== All 5 Tests Complete ===');
}

runTests().catch(console.error);
