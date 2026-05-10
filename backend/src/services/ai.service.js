// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import config from "../config/config.js";
import { createAgent, toolStrategy } from "langchain";
import z from "zod";

const model = new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: config.MISTRAL_API_KEY,
});

const agent = createAgent({
  model,
  tools: [],
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
