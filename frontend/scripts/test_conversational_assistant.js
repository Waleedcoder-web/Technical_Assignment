// frontend/scripts/test_conversational_assistant.js
// Tests the 7 conversational, RAG, and property search scenarios for HavenKey AI Assistant

const fetch = globalThis.fetch || require("node-fetch");

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

const TEST_SCENARIOS = [
  {
    id: 1,
    name: "Pure Greeting",
    question: "Hi",
    expectedIntent: "GREETING",
  },
  {
    id: 2,
    name: "General Conversation (Well-being inquiry)",
    question: "Hello, how are you?",
    expectedIntent: "GENERAL_CONVERSATION",
  },
  {
    id: 3,
    name: "General Conversation (Gratitude)",
    question: "Thank you",
    expectedIntent: "GENERAL_CONVERSATION",
  },
  {
    id: 4,
    name: "General Conversation (Capabilities)",
    question: "What can you do?",
    expectedIntent: "GENERAL_CONVERSATION",
  },
  {
    id: 5,
    name: "Company Info (RAG Pipeline)",
    question: "What services does HavenKey provide?",
    expectedIntent: "COMPANY_INFO",
  },
  {
    id: 6,
    name: "Property Search (Lahore Houses)",
    question: "Find a house in Lahore.",
    expectedIntent: "PROPERTY_SEARCH",
  },
  {
    id: 7,
    name: "Dual Intent (BOTH: Services + Lahore House Search)",
    question: "Tell me about your services and find a house in Lahore.",
    expectedIntent: "BOTH",
  },
];

async function runScenario(scenario) {
  console.log(`\n================================================================================`);
  console.log(`[Test ${scenario.id}: ${scenario.name}]`);
  console.log(`Question: "${scenario.question}"`);

  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/ai/company-rag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: scenario.question }),
    });

    const elapsed = Date.now() - start;
    const data = await res.json();

    console.log(`HTTP Status: ${res.status}`);
    console.log(`Detected Intent: ${data.intent} (Expected: ${scenario.expectedIntent})`);
    console.log(`Grounded: ${data.grounded}`);
    console.log(`Answer:\n${data.answer}`);
    console.log(`Properties Count: ${data.properties ? data.properties.length : 0}`);
    if (data.properties && data.properties.length > 0) {
      data.properties.forEach((p, idx) => {
        console.log(`  ${idx + 1}. [${p.id}] ${p.title} (${p.location}) - PKR ${p.price?.toLocaleString()} [${p.listing_type}]`);
      });
    }
    if (data.sources && data.sources.length > 0) {
      console.log(`RAG Sources: ${JSON.stringify(data.sources)}`);
    }
    console.log(`Latency: ${elapsed} ms`);

    const intentMatches = data.intent === scenario.expectedIntent;
    console.log(`Status: ${intentMatches ? "PASS" : "FAIL"}`);
    return intentMatches;
  } catch (err) {
    console.error(`Error executing scenario ${scenario.id}:`, err.message);
    return false;
  }
}

async function runAll() {
  console.log("=== HavenKey AI Assistant Conversational & RAG Verification Suite ===");
  let passed = 0;
  for (const s of TEST_SCENARIOS) {
    const ok = await runScenario(s);
    if (ok) passed++;
  }
  console.log(`\n================================================================================`);
  console.log(`Summary: ${passed} / ${TEST_SCENARIOS.length} tests passed.`);
}

runAll().catch(console.error);
