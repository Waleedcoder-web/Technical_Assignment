// frontend/scripts/test_multiturn_context.js
// Automated verification suite for multi-turn conversation context handling in HavenKey AI Assistant

const fetch = globalThis.fetch || require("node-fetch");

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

async function postMessage(question, sessionId, pendingSearchParams) {
  const payload = { question, sessionId };
  if (pendingSearchParams !== undefined) {
    payload.pendingSearchParams = pendingSearchParams;
  }

  const res = await fetch(`${BASE_URL}/api/ai/company-rag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function runMultiTurnFlow(flowId, title, turns) {
  console.log(`\n================================================================================`);
  console.log(`[Flow ${flowId}: ${title}]`);
  const sessionId = `test_flow_${flowId}_${Date.now()}`;
  let currentPending = null;
  let allTurnsPassed = true;

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    console.log(`\n--- Turn ${i + 1}: User sends "${turn.message}" ---`);

    const start = Date.now();
    const { status, data } = await postMessage(turn.message, sessionId, currentPending);
    const elapsed = Date.now() - start;

    console.log(`HTTP Status: ${status}`);
    console.log(`Detected Intent: ${data.intent} (Expected: ${turn.expectedIntent})`);
    console.log(`Requires Clarification: ${Boolean(data.requiresClarification)} (Expected: ${Boolean(turn.expectedClarification)})`);
    console.log(`Answer:\n${data.answer}`);
    if (data.properties && data.properties.length > 0) {
      console.log(`Properties Count: ${data.properties.length}`);
      data.properties.forEach((p, idx) => {
        console.log(`  ${idx + 1}. [${p.id}] ${p.title} (${p.location}) - PKR ${p.price?.toLocaleString()} [${p.listing_type}]`);
      });
    }
    if (data.pendingSearchParams) {
      console.log(`Pending Params: ${JSON.stringify(data.pendingSearchParams)}`);
    }
    console.log(`Latency: ${elapsed} ms`);

    // Verify expectations
    const intentMatch = data.intent === turn.expectedIntent;
    const clarifMatch = Boolean(data.requiresClarification) === Boolean(turn.expectedClarification);

    let paramsMatch = true;
    if (turn.expectedParams) {
      for (const [k, v] of Object.entries(turn.expectedParams)) {
        if (data.pendingSearchParams?.[k] !== v) {
          console.warn(`[Param Mismatch] Key '${k}': got ${data.pendingSearchParams?.[k]}, expected ${v}`);
          paramsMatch = false;
        }
      }
    }

    const turnPassed = intentMatch && clarifMatch && paramsMatch;
    console.log(`Turn ${i + 1} Status: ${turnPassed ? "PASS" : "FAIL"}`);

    if (!turnPassed) {
      allTurnsPassed = false;
    }

    // Carry forward pending search parameters as client does
    currentPending = data.pendingSearchParams !== undefined ? data.pendingSearchParams : null;
  }

  console.log(`\nFlow ${flowId} Overall: ${allTurnsPassed ? "ALL TURNS PASSED" : "FAILED"}`);
  return allTurnsPassed;
}

async function runAllFlows() {
  console.log("=== HavenKey AI Assistant Multi-Turn Conversation Context Verification ===");

  const flows = [
    {
      id: 1,
      title: 'Find a 10 marla property. -> Sialkot.',
      turns: [
        {
          message: "Find a 10 marla property.",
          expectedIntent: "PROPERTY_SEARCH",
          expectedClarification: true,
          expectedParams: { area_value: 10, area_unit: "Marla", location: null },
        },
        {
          message: "Sialkot.",
          expectedIntent: "PROPERTY_SEARCH",
          expectedClarification: false,
          expectedParams: { area_value: 10, area_unit: "Marla", location: "Sialkot" },
        },
      ],
    },
    {
      id: 2,
      title: 'Find a house. -> Lahore.',
      turns: [
        {
          message: "Find a house.",
          expectedIntent: "PROPERTY_SEARCH",
          expectedClarification: true,
          expectedParams: { property_type: "villas", location: null },
        },
        {
          message: "Lahore.",
          expectedIntent: "PROPERTY_SEARCH",
          expectedClarification: false,
          expectedParams: { property_type: "villas", location: "Lahore" },
        },
      ],
    },
    {
      id: 3,
      title: 'Find a house in Sialkot. -> Under 50 lakh.',
      turns: [
        {
          message: "Find a house in Sialkot.",
          expectedIntent: "PROPERTY_SEARCH",
          expectedClarification: false,
          expectedParams: { property_type: "villas", location: "Sialkot" },
        },
        {
          message: "Under 50 lakh.",
          expectedIntent: "PROPERTY_SEARCH",
          expectedClarification: false,
          expectedParams: { property_type: "villas", location: "Sialkot", max_price: 5000000 },
        },
      ],
    },
    {
      id: 4,
      title: 'Find rental properties. -> Lahore.',
      turns: [
        {
          message: "Find rental properties.",
          expectedIntent: "PROPERTY_SEARCH",
          expectedClarification: true,
          expectedParams: { listing_type: "rent", location: null },
        },
        {
          message: "Lahore.",
          expectedIntent: "PROPERTY_SEARCH",
          expectedClarification: false,
          expectedParams: { listing_type: "rent", location: "Lahore" },
        },
      ],
    },
    {
      id: 5,
      title: 'Find a 10 marla house. -> Sialkot. -> Execute search.',
      turns: [
        {
          message: "Find a 10 marla house.",
          expectedIntent: "PROPERTY_SEARCH",
          expectedClarification: true,
          expectedParams: { property_type: "villas", area_value: 10, area_unit: "Marla", location: null },
        },
        {
          message: "Sialkot.",
          expectedIntent: "PROPERTY_SEARCH",
          expectedClarification: false,
          expectedParams: { property_type: "villas", area_value: 10, area_unit: "Marla", location: "Sialkot" },
        },
      ],
    },
    {
      id: 6,
      title: 'Start property search -> Switch to unrelated company-policy question.',
      turns: [
        {
          message: "Find a 10 marla house.",
          expectedIntent: "PROPERTY_SEARCH",
          expectedClarification: true,
          expectedParams: { property_type: "villas", area_value: 10, area_unit: "Marla", location: null },
        },
        {
          message: "What are the responsibilities of a tenant?",
          expectedIntent: "COMPANY_INFO",
          expectedClarification: false,
        },
      ],
    },
  ];

  let passed = 0;
  for (const flow of flows) {
    const ok = await runMultiTurnFlow(flow.id, flow.title, flow.turns);
    if (ok) passed++;
  }

  console.log(`\n================================================================================`);
  console.log(`Multi-Turn Verification Summary: ${passed} / ${flows.length} flows passed successfully.`);
}

runAllFlows().catch(console.error);
