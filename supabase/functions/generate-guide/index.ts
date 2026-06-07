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
      `${company} ${role} interview experience reddit`,
      `${company} ${role} interview questions 2024 2025`,
      `${company} ${role} hiring process glassdoor`,
      `${company} ${role} seniority signals evaluation`,
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

    const searchContext = results
      .slice(0, 15)
      .map(
        (item: any) => `
Title: ${item.title}
Content: ${item.content}
URL: ${item.url}
`
      )
      .join("\n\n");

const prompt = `
You are a Lead Professional Recruiter and ELITE Career Coach. Your task is to SURGICALLY MINE the provided Search Context for REAL-WORLD interview questions and evaluation patterns at ${company} for ${role} roles.

TARGET CANDIDATE: ${experience} Years of Experience.

SEARCH CONTEXT:
${searchContext}

CRITICAL INSTRUCTIONS:
1. SUPPORT ANY ROLE: The user could be a Software Engineer, Product Manager, Nurse, Marketing Lead, or any other professional. 
2. IGNORE generic, textbook advice. 
3. PRIORITIZE questions and patterns found in the Search Context (Reddit, Glassdoor, Professional Blogs).
4. For each of the 20 questions, provide:
   - The specific prompt or task the interviewer gives.
   - "Why they ask": The underlying skill, personality trait, or seniority signal they are testing.
   - "Key to Answer": 2-3 specific points, metrics, or keywords the candidate MUST mention to pass.
5. The 14-Day Preparation Plan must be actionable, daily tasks tailored to the specific role of ${role}.

Return ONLY a valid JSON object matching this exact structure:
{
  "difficultyScore": <number 1-10>,
  "difficultyLabel": "<Optimized|Elevated|Complex|Extreme>",
  "difficultyReason": "<One punchy sentence why for ${experience}yr candidate>",
  "interviewRounds": [
    { "name": "<round name>", "description": "<actionable summary of what is evaluated>", "duration": "<e.g. 45 min>" }
  ],
  "topTopics": ["<topic/skill 1>", "<topic/skill 2>", ...],
  "topQuestions": [
    { 
      "question": "<specific question prompt>", 
      "category": "<e.g. Technical|Behavioral|Leadership|Case Study|Clinical|Operational>",
      "whyAsk": "<underlying seniority or skill signal they are looking for>",
      "keyPoints": ["<must-mention point 1>", "<must-mention point 2>"]
    }
  ],
  "preparationPlan": [
    { "week": 1, "focus": "<focus area>", "tasks": ["<task 1>", "<task 2>", ...] },
    { "week": 2, "focus": "<focus area>", "tasks": ["<task 1>", "<task 2>", ...] }
  ],
  "keyInsights": ["<punchy strategy insight 1>", "<punchy strategy insight 2>", ...],
  "strategicBriefing": [
    { 
      "title": "<module title>", 
      "type": "<insight|warning|strategy>", 
      "points": ["<point 1>", "<point 2>", ...] 
    }
  ]
}

Rules:
- topQuestions: exactly 20 items.
- BE EXTREMELY CONCISE. Avoid generic fluff or repetitive introductory phrases.
- Every word must provide high-signal value for the specific role and company.
- Return ONLY the JSON object. No markdown.
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
      "{}";

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