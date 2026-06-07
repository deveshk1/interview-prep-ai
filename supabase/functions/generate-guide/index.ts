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

    const queries = [
      `${company} ${role} interview experience`,
      `${company} ${role} interview questions`,
      `${company} ${role} hiring process`,
      `${company} ${role} system design`,
      `${company} ${role} reddit interview`,
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

    const results = responses.flatMap(
      (r: any) => r.results || []
    );

    const searchContext = results
      .slice(0, 15)
      .map(
        (item: any) => `
Title: ${item.title}

Content:
${item.content}

URL:
${item.url}
`
      )
      .join("\n\n");

const prompt = `
You are an ELITE Silicon Valley Interview Coach. Your goal is to provide a surgical, actionable preparation guide for a candidate.

TARGET CONTEXT:
Company: ${company}
Role: ${role}
Candidate Seniority: ${experience} years of experience

CRITICAL INSTRUCTIONS:
1. NO long paragraphs. NO generic "filler" text or fluff.
2. Every sentence must provide high-signal, actionable value.
3. Tailor the depth of topics and technical questions strictly to someone with ${experience} years of experience.
4. Maintain a professional, elite, and encouraging tone.
5. Use bullet points for tasks and insights.

Return ONLY a valid JSON object (no markdown, no preamble) with this exact structure:
{
  "difficultyScore": <number 1-10>,
  "difficultyLabel": <"Easy"|"Medium"|"Hard"|"Very Hard">,
  "difficultyReason": "<ONE punchy sentence explaining why for a candidate with ${experience} years exp>",
  "interviewRounds": [
    { "name": "<round name>", "description": "<actionable summary>", "duration": "<e.g. 45 min>" }
  ],
  "topTopics": ["<topic1>", "<topic2>", ...],
  "topQuestions": [
    { "question": "<question text>", "category": "<DSA|System Design|Java|Spring|Behavioral|Other>" }
  ],
  "preparationPlan": [
    { "week": 1, "focus": "<focus area>", "tasks": ["<task1>", "<task2>"] },
    { "week": 2, "focus": "<focus area>", "tasks": ["<task1>", "<task2>"] }
  ],
  "keyInsights": ["<punchy insight 1>", "<punchy insight 2>", ...],
  "strategicBriefing": [
    { 
      "title": "<module title>", 
      "type": "<insight|warning|strategy>", 
      "points": ["<actionable point 1>", "<actionable point 2>", ...] 
    }
  ]
}

Rules:
- topQuestions: exactly 20 items.
- preparationPlan: exactly 2 weeks.
- keyInsights: exactly 5-7 bullet points.
- interviewRounds: 3-6 rounds.
- strategicBriefing: 4-6 modular sections. DO NOT return a single long text block.
- Return ONLY the JSON object.
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
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

    const guide =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated";

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