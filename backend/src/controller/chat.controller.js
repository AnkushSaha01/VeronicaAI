import { getStream, getTitle } from "../services/ai.service.js";
import * as chatDao from "../dao/chat.dao.js";
// import { tavily  } from "@tavily/core";
// import config from "../config/config.js";

export async function handleMessage(req, res) {
  const message = req.body.message;
  // console.log(message);
  const { chatId } = req.body;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const generateTitle = async () => {
    if (!chatId) {
      const data = await getTitle({ message });
      const chat = await chatDao.createChat({
        title: data.chatTitle,
        user: req.user.id,
      });
      res.write(
        `title: ${JSON.stringify({ title: data.chatTitle, chatId: chat._id })}\n\n`,
      );
      return chat._id;
    }
    return chatId;
  };

  const aiResponse = async () => {
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant. If you don't have the answer to the user's query, use the tool search_tool to find the answer on the internet. Try to answer only in 100 words or less"
      },
      {
        role: "user",
        content: `${message},
        
        current date is ${new Date().toDateString()}.`,
      },
    ];

    const stream = await getStream(messages);

    let AIResponse = "";

    for await (const chunk of stream) {
      const messageChunk = Array.isArray(chunk) ? chunk[0] : chunk;
      
      // Only stream back AI generated responses, ignore tool outputs or intermediate steps
      if (messageChunk.getType() === 'ai' && messageChunk.content) {
        const aiChunk = messageChunk.content;
        AIResponse += aiChunk;
        res.write(`data: ${JSON.stringify({ chunk: aiChunk })}\n\n`);
      }
    }

    return AIResponse;
  };

  try {
    const [chatIdNew, AIMessage] = await Promise.all([generateTitle(), aiResponse()]);

    console.log("Saving messages with chatId:", chatIdNew);
    console.log("User message:", message);
    console.log("AI message:", AIMessage);

    const savedUserMsg = await chatDao.saveMessage({
      chatId: chatIdNew,
      sender: "user",
      content: message,
    });
    console.log("User message saved successfully:", savedUserMsg._id);

    const savedAiMsg = await chatDao.saveMessage({
      chatId: chatIdNew,
      sender: "ai",
      content: AIMessage || " ", // Fallback in case AIMessage is empty to prevent Mongoose required validation failure
    });
    console.log("AI message saved successfully:", savedAiMsg._id);

  } catch (error) {
    console.error("Error occurred while saving messages to database:", error);
  } finally {
    res.end();
  }
}

export async function getChats(req, res) {
  const userId = req.user.id;
  try {
    const chats = await chatDao.getAllChatsForUser(userId);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getMessages(req, res) {
  const { chatId } = req.params;
  try {
    const messages = await chatDao.getMessagesForChat(chatId);
    const formattedMessages = messages.map(m => ({
      role: m.sender === 'ai' ? 'assistant' : m.sender,
      content: m.content,
      timestamp: m.createdAt
    }));
    res.json(formattedMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// const tvly = tavily({ apiKey: config.TAVILY_API_KEY });

// export async function getAnswerWithInternetAccess(req, res) {
//   const userPrompt = req.body.message;
//   const { chatId } = req.body;

//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   const generateTitle = async () => {
//     if (!chatId) {
//       const data = await getTitle({ message: userPrompt });
//       const chat = await chatDao.createChat({
//         title: data.chatTitle,
//         user: req.user.id,
//       });
//       res.write(
//         `title: ${JSON.stringify({ title: data.chatTitle, chatId: chat._id })}\n\n`,
//       );
//       return chat._id;
//     }
//     return chatId;
//   };

//   const aiResponse = async () => {
//     // 1. Search the web using the user's prompt
//     const searchResponse = await tvly.search(userPrompt, {
//        includeAnswer: true, 
//        maxResults: 5 
//     });
    
//     console.log("Tavily answer:", searchResponse.answer);
    
//     // 2. Feed the search context + the user prompt to MistralAI
//     const myAiPrompt = `
//       You are a helpful assistant. Use the following real-time web results to answer the user's query.
      
//       Web Context:
//       ${JSON.stringify(searchResponse.results)}
      
//       User Query: ${userPrompt}
//     `;
    
//     const messages = [
//       {
//         role: "user",
//         content: myAiPrompt,
//       },
//     ];

//     const stream = await getStream(messages);

//     let AIResponse = "";

//     for await (const chunk of stream) {
//       const aiChunk = chunk[0].content;
//       AIResponse += aiChunk;

//       res.write(`data: ${JSON.stringify({ chunk: aiChunk })}\n\n`);
//     }

//     return AIResponse;
//   };

//   try {
//     const [chatIdNew, AIMessage] = await Promise.all([generateTitle(), aiResponse()]);

//     console.log("Saving search messages with chatId:", chatIdNew);
//     console.log("User query:", userPrompt);
//     console.log("AI response:", AIMessage);

//     const savedUserMsg = await chatDao.saveMessage({
//       chatId: chatIdNew,
//       sender: "user",
//       content: userPrompt,
//     });
//     console.log("User query saved successfully:", savedUserMsg._id);

//     const savedAiMsg = await chatDao.saveMessage({
//       chatId: chatIdNew,
//       sender: "ai",
//       content: AIMessage || " ",
//     });
//     console.log("AI response saved successfully:", savedAiMsg._id);

//   } catch (error) {
//     console.error("Error during web search / MistralAI stream:", error);
//     res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
//   } finally {
//     res.end();
//   }
// }


