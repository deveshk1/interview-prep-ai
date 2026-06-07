export async function generateInterviewGuide(company, role, experience) {
  const response = await fetch(
    "https://gvdzcnodcsuzsyumfgvi.supabase.co/functions/v1/generate-guide",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, role, experience }),
    }
  );

  const data = await response.json();
  return data.guide;
}