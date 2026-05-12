import { MistralAIEmbeddings } from "@langchain/mistralai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import config from "../config/config.js";

const embeddings = new MistralAIEmbeddings({
  apiKey: config.MISTRAL_API_KEY,
  model: "mistral-embed",
});

const pinecone = new PineconeClient({
  apiKey: config.PINECONE_API_KEY,
});

export async function ragSearch({ query }) {
  try {
    console.log("========================================================");
    console.log("using rag tool with query =>", query);
    console.log("========================================================");

    const index = pinecone.Index("kodr-rag");

    const vector = await embeddings.embedQuery(query);

    const queryResult = await index.query({
      vector,
      topK: 2,
      includeMetadata: true,
    });

    console.log("========================================================");
    console.log("rag tool result =>", JSON.stringify(queryResult));
    console.log("========================================================");

    if (queryResult.matches && queryResult.matches.length > 0) {
      const resultText = queryResult.matches.map((match) => {
        return match.metadata?.text || JSON.stringify(match.metadata);
      });
      return resultText.join("\n\n --- \n\n");
    }

    return "No relevant information found.";
  } catch (error) {
    console.error("Error in ragSearch:", error);
    throw error;
  }
}

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { v4 as uuidv4 } from "uuid";

export async function ingestPDF(pdfPath) {
  try {
    console.log("========================================================");
    console.log("ingesting pdf =>", pdfPath);
    console.log("========================================================");

    const loader = new PDFLoader(pdfPath, {
      splitPages: true,
    });

    const docs = await loader.load();

    const vectors = await embeddings.embedDocuments(
      docs.map((doc) => doc.pageContent)
    );

    const records = vectors.map((vector, index) => ({
      id: uuidv4(),
      values: vector,
      metadata: {
        text: docs[index].pageContent,
        page: index + 1,
      },
    }));

    const index = pinecone.Index("kodr-rag");

    const upsertResult = await index.upsert({ records });

    console.log("========================================================");
    console.log("ingest result =>", JSON.stringify(upsertResult));
    console.log("========================================================");

    return upsertResult;
  } catch (error) {
    console.error("Error in ingestPDF:", error);
    throw error;
  }
}
