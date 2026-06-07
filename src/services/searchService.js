import axios from "axios";

export async function searchCompany(company, role) {

  const queries = [
    `${company} ${role} interview experience`,
    `${company} ${role} interview questions`,
    `${company} ${role} system design round`,
    `${company} ${role} hiring process`,
    `${company} ${role} reddit interview`
  ];

  const responses = await Promise.all(
    queries.map(query =>
      axios.post(
        "https://api.tavily.com/search",
        {
          api_key:
            import.meta.env.VITE_TAVILY_API_KEY,

          query,

          max_results: 5
        }
      )
    )
  );

  const mergedResults = [];

  responses.forEach(response => {

    if (response.data?.results) {
      mergedResults.push(
        ...response.data.results
      );
    }

  });

  console.log(
    "Total Search Results:",
    mergedResults.length
  );

  return {
    results: mergedResults
  };
}