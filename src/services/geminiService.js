import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export async function generateInterviewGuide(
  company,
  role,
  experience,
  searchResults
) {

  const searchContext = (searchResults || [])
    .slice(0, 15)
    .map(
      (item) => `
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

Company:
${company}

Role:
${role}

Experience:
${experience} years

Below are real search results collected from the internet.

${searchContext}

Use the search results as the primary source of truth.

Supplement with your own knowledge only when necessary.

Clearly distinguish:
- Frequently reported interview experiences
- Commonly asked topics
- Your expert recommendations

Generate a detailed markdown report with:

# Interview Process

Describe the actual interview rounds and flow.

# Most Asked Technical Topics

List the most frequently mentioned technical areas.

# Most Asked Java Questions

Focus on Java topics repeatedly appearing in sources.

# Most Asked Spring Boot Questions

Focus on Spring Boot, Microservices, REST APIs, Security, etc.

# DSA Patterns

Mention frequently asked data structures and algorithms.

# System Design Topics

Mention commonly discussed design problems and architecture concepts.

# Behavioral Questions

List likely behavioral and leadership questions.

# 14-Day Preparation Plan

Provide a day-by-day preparation roadmap.

# Important Insights

Summarize key findings from the search results.

Mention which topics appear repeatedly across multiple sources.

Do not invent company-specific facts if they are not supported by the search results.

Return clean markdown.
`;

  const models = [
    "gemini-2.5-flash-lite",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it",
  ];

  let lastError;

  for (const model of models) {
    try {
      console.log(`Trying ${model}`);

      const response = await ai.models.generateContent({
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
}