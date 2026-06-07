import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export async function generateInterviewGuide(
  company,
  role,
  experience,
  searchResults,
) {


  const searchContext = (searchResults || []).map(
    item => `
    Title: ${item.title}

    Content: ${item.content}

    URL: ${item.url}
    `
  ).join("\n\n");

  const prompt = `
You are an expert interview coach.

Company:
${company}

Role:
${role}

Experience:
${experience}

Below are real search results collected from the internet.

${searchContext}

Using ONLY the information above plus your own knowledge:

Generate:

# Interview Process

# Most Asked Technical Topics

# Most Asked Java Questions

# Most Asked Spring Boot Questions

# DSA Patterns

# System Design Topics

# Behavioral Questions

# 14-Day Preparation Plan

# Important Insights

Mention which topics appear repeatedly across sources.

Do not invent company-specific facts if they are not supported by the search results.
`;

  const models = [
    "gemini-2.5-flash-lite",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it",
  ];

  let response;
  let lastError;

  for (const model of models) {
    try {
      console.log(`Trying ${model}`);

      response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      console.log(`Success with ${model}`);

      return response.text;
    } catch (err) {
      console.error(`${model} failed`, err);
      lastError = err;
    }
  }

  throw lastError;

  return response.text;
}
