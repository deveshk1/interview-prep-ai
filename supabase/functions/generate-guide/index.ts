import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
    });
  }

  try {
    const { company, role, experience } = await req.json();

    const tavilyKey = Deno.env.get("TAVILY_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const queries = [
      `${company} ${role} interview experience reddit ${currentYear} ${lastYear}`,
      `${company} ${role} technical interview questions "last 6 months"`,
      `${company} ${role} interview "level ${experience > 8 ? 'L6/L7' : 'L4/L5'}" questions`,
      `${company} ${role} interview process ${currentYear} site:glassdoor.com`,
      `${company} ${role} system design interview ${currentYear} blog`,
    ];

    const responses = await Promise.all(
      queries.map((query) =>
        fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            max_results: 5,
          }),
        }).then((r) => r.json())
      )
    );

    const results = responses.flatMap((r: any) => r.results || []);
    console.log(`Tavily found ${results.length} results.`);

    const searchContext = results
      .slice(0, 8)
      .map(
        (item: any) => `
Title: ${item.title}
Content: ${item.content}
URL: ${item.url}
`
      )
      .join("\n\n");

const prompt = `
You are a Lead Professional Recruiter and ELITE Technical Interview Coach. Your task is to SURGICALLY MINE the provided Search Context for RECENT (Past 6-12 Months) and REAL-WORLD interview questions at ${company} for ${role} roles.

TARGET CANDIDATE: ${experience} Years of Experience (Seniority: ${experience > 8 ? 'Staff/Senior-Plus' : 'Mid-Senior'}).

SEARCH CONTEXT:
${searchContext}

PREMIUM-TIER QUALITY MANDATES:
1. RECENCY FIRST: Prioritize questions mentioned in posts from ${currentYear} and ${lastYear}.
2. SENIORITY CALIBRATION: For ${experience} years of experience, ignore "Junior/Entry" questions. Focus on architectural trade-offs, scalability bottlenecks, system failures, and leadership at scale.
3. NO REPETITION: Every question must be a unique technical or behavioral signal.
4. SURGICAL DETAIL: Instead of "How do you scale?", use specific prompts like "How did ${company} handle the 2024 migration to cell-based architecture for ${role}-related services?" if found in context.
5. TECHNICAL CATEGORIES: You MUST categorize technical questions into: "DSA", "System Design (HLD)", "Low-Level Design/Machine Coding", "Domain Specific Core", and "Behavioral/Leadership".

Return ONLY a valid JSON object matching this exact structure:
{
  "difficultyScore": <number 1-10>,
  "difficultyLabel": "<Optimized|Elevated|Complex|Extreme>",
  "difficultyReason": "<Technical bar for ${experience}yr candidate in ${currentYear}>",
  "interviewRounds": [
    { "name": "<Round Name>", "description": "<Actionable technical expectations>", "duration": "<e.g. 60 min>" }
  ],
  "topTopics": ["<Topic: e.g. Distributed Systems, CAP Theorem, LLD for Billing>"],
  "topQuestions": [
    { 
      "question": "<Specific technical prompt or problem statement>", 
      "category": "<Must be one of: DSA, System Design, LLD, Technical Core, Behavioral>",
      "whyAsk": "<The specific technical or architectural signal being tested>",
      "keyPoints": ["<Technical keyword 1>", "<Architectural trade-off 2>"]
    }
  ],
  "preparationPlan": [
    { "week": 1, "focus": "Core Fundamentals & DSA", "tasks": ["<Task 1>", "<Task 2>"] },
    { "week": 2, "focus": "System Design & Mock Interviews", "tasks": ["<Task 1>", "<Task 2>"] }
  ],
  "keyInsights": ["<High-signal technical patterns observed at ${company}>"],
  "strategicBriefing": [
    { 
      "title": "<Technical Pillar>", 
      "type": "strategy", 
      "points": ["<Direct technical advice 1>", "<Direct technical advice 2>"] 
    }
  ]
}

Rules:
- topQuestions: exactly 20 items.
- Focus on "Hidden" patterns not found in generic prep guides.
- Use technical terminology appropriate for ${experience}yr seniority.
- ABSOLUTELY NO INTRODUCTORY TEXT.
`;

    const models = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash"
];

    let guide = "{}";
    let lastError = null;

    for (const model of models) {
      try {
        console.log(`Attempting generation with model: ${model}`);
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          }
        );

        const geminiData = await geminiResponse.json();
        
        if (geminiData.error) {
          console.error(`Model ${model} failed:`, geminiData.error.message);
          lastError = geminiData.error;
          continue;
        }

        console.log(
  "Gemini Response:",
  JSON.stringify(geminiData, null, 2)
);

const candidateText =
  geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;


        if (candidateText && candidateText !== "{}") {
          guide = candidateText;
          console.log(`Successfully generated guide using ${model}`);
          break;
        } else {
          console.warn(`Model ${model} returned empty response.`);
        }
      } catch (err) {
        console.error(`Error with model ${model}:`, err);
        lastError = err;
      }
    }

    if (guide === "{}" && lastError) {
       return new Response(
        JSON.stringify({ error: "All models failed to generate a guide.", details: lastError }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    return new Response(
      JSON.stringify({
        guide,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});