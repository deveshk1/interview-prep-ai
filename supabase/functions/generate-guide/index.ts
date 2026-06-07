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
    const { company, role } = await req.json();

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
You are an expert interview coach.

Company: ${company}

Role: ${role}

Use the following interview experiences:

${searchContext}

Generate:

# Interview Process

# Technical Topics

# Java Questions

# Spring Boot Questions

# DSA

# System Design

# Behavioral

# 14 Day Study Plan

Return markdown.
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