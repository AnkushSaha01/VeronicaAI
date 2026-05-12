// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import config from "../config/config.js";
import { createAgent, toolStrategy, tool } from "langchain";
import z from "zod";
import { searchWeb } from "../tools/search.tool.js";
import { ragSearch } from "../tools/rag.tool.js";

const search_tool = tool(searchWeb, {
  name: "search_tool",
  description:
    "Use this tool to find latest information on the internet. Mandatory to use this tool if you don't have the information about user query.",
  schema: z.object({
    query: z.string().describe("The search query to find information about"),
  }),
});

const rag_tool = tool(ragSearch, {
  name: "rag_tool",
  description:
    "Use this tool to search through the specific document database or internship details.",
  schema: z.object({
    query: z.string().describe("The specific query to search in the vector database"),
  }),
});

const model = new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: config.MISTRAL_API_KEY,
});

const agent = createAgent({
  model,
  tools: [search_tool, rag_tool],
});
export async function getStream(messages) {
  const response = await agent.stream(
    { messages },
    {
      streamMode: "messages",
    },
  );
  return response;
}

export async function generateResponse(messages) {
  const response = await model.invoke(messages);
  return response;
}

export async function getTitle({ message }) {
  const titleAgent = createAgent({
    model,
    tools: [],
    responseFormat: toolStrategy(
      z.object({
        chatTitle: z.string().describe("A concise title for the given message"),
      }),
    ),
  });

  const response = await titleAgent.invoke({
    messages: [
      {
        role: "user",
        content: `Generate a concise title for the following message: ${message}`,
      },
    ],
  });

  console.log(response.structuredResponse);

  return response.structuredResponse;
}
