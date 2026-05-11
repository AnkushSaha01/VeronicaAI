import { tavily } from "@tavily/core";
import config from "../config/config.js";

const tavilyClient = tavily({
  apiKey: config.TAVILY_API_KEY,
});

export async function searchWeb({ query }) {
  try {
    console.log("========================================================");
    console.log("using tool with query =>", query);
    console.log("========================================================");
    
    const response = await tavilyClient.search(query, {
      maxResults: 5,
    });

    const result = response.results.map((r) => r.content);

    console.log("========================================================");
    console.log("tool result =>", result);
    console.log("========================================================");

    return result.join("\n\n --- \n\n");
  } catch (error) {
    console.error("Error in searchWeb:", error);
    throw error;
  }
}
