# Veronica AI (Sense AI) — Codebase & Architectural Context

Welcome to the **Veronica AI (Sense AI)** codebase. This document provides a complete, production-grade guide to the architecture, directory layout, core configuration, backend APIs, data flows, AI/RAG integration, and frontend components of the system. 

It is designed to serve as a comprehensive contextual input for any large language model or developer seeking to understand, maintain, or expand this codebase.

---

## 1. Architectural Overview & Design System

Veronica AI is built as a **Monolithic Single-Page Application (SPA)** utilizing a unified repository structure:
- **Backend (Express 5.x / Node.js)**: Responsible for serving static frontend assets, handling API routes, processing user authentication (Passport Google OAuth 2.0), orchestrating database connections (Mongoose + Pinecone), and running the AI Agent pipeline (LangChain + Mistral AI).
- **Frontend (Next.js 16.x SPA)**: Developed as an interactive, highly responsive client-side SPA. For production builds, it is compiled into a static export (`output: 'export'`) and loaded under `backend/public`, enabling a single deployed web process (e.g. on Render) to host the full application.

### Monolithic Serving & Client-Side Routing
To prevent client-side pages from throwing `404` errors on refresh under monolithic hosting:
1. **Static Export**: The Next.js config specifies `output: "export"`, exporting static HTML, CSS, and JS files to the `frontend/out` folder.
2. **Static Asset Copier**: The root build script copies these compiled assets directly to `backend/public`.
3. **Wildcard Fallback (SPA routing)**: In `backend/src/app.js`, after exposing standard API routes, Express maps all unmatched requests to `/index.html` using a wildcard fallback middleware:
   ```javascript
   app.use(express.static(publicPath));
   app.use((req, res) => {
     res.sendFile(path.join(publicPath, "index.html"));
   });
   ```

### Storage Layers
1. **MongoDB (Mongoose)**: Manages relational transactional data: users, active chat sessions, and historical chat messages.
2. **Pinecone Vector Database**: Maintains document vector indexes for document ingestion and semantic Retrieval-Augmented Generation (RAG).

---

## 2. Directory Tree Map

```text
VeronicaAI/
├── package.json                   # Root package definitions, monorepo scripts
├── docker-compose.yml             # Docker multi-service configuration
├── backend/                       # Express Monolithic Server
│   ├── server.js                  # Entry point for HTTP server boot
│   ├── package.json               # Backend dependencies and scripts
│   ├── dockerfile                 # Container packaging configuration
│   ├── src/
│   │   ├── app.js                 # Express Application and routing middleware setup
│   │   ├── config/
│   │   │   ├── config.js          # Shared env and config schema mapping
│   │   │   ├── db.js              # MongoDB connectivity configuration
│   │   │   └── passport.js        # Google OAuth Strategy mapping
│   │   ├── controller/
│   │   │   ├── auth.controller.js # JWT cookie setting, getMe user verification
│   │   │   └── chat.controller.js # SSE messaging streams, document ingestion, thread deletion
│   │   ├── dao/
│   │   │   └── chat.dao.js        # Mongoose Data Access methods (CRUD)
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js # HTTP-Only Cookie JWT decryption
│   │   ├── models/
│   │   │   ├── user.model.js      # Mongoose User collection Schema
│   │   │   ├── chat.model.js      # Mongoose Chat thread metadata collection Schema
│   │   │   └── message.model.js   # Mongoose Message history Schema
│   │   ├── services/
│   │   │   └── ai.service.js      # LangChain model and agent orchestrator
│   │   └── tools/
│   │       ├── rag.tool.js        # Pinecone semantic document search and PDF ingestion
│   │       └── search.tool.js     # Tavily internet web-search agent tool
│   └── uploads/                   # Temporary multipart upload file directory
└── frontend/                      # Next.js 16 SPA Client
    ├── package.json               # Frontend dependencies and Next.js commands
    ├── next.config.mjs            # Static export compilation settings
    ├── dockerfile                 # Frontend independent package configuration
    ├── public/                    # Raw static assets, logo assets, GIFs
    └── src/
        └── app/
            ├── layout.jsx         # App-wide global HTML wrap, imports global fonts (Inter)
            ├── page.jsx           # Entry route redirecting to login page (/auth)
            ├── StoreProvider.jsx  # Redux Provider container for state hydration
            ├── app.store.js       # Main Redux Store config
            ├── globals.css        # PostCSS Tailwind directives and visual modifications
            ├── auth/
            │   └── page.jsx       # Login layout featuring glassmorphism and google button
            └── chats/
                ├── page.jsx       # Dynamic conversational window, reactive inputs, speech hook
                ├── components/
                │   └── Sidebar.jsx # Thread history manager, cascade deletion, user footer
                ├── hooks/
                │   └── useChat.js # Hook interfacing custom services with Redux dispatchers
                ├── service/
                │   └── chat.api.js # Native fetch wrappers and line-by-line SSE chunk streams
                └── slice/
                    └── chat.slice.js # Redux reducers for tracking threads, messages, and profiles
```

---

## 3. Database Schemas (MongoDB / Mongoose)

Mongoose is used to store conversational state, authentication logs, and threads.

### User Schema (`backend/src/models/user.model.js`)
Stores the profile and core identity of authenticated users.
```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        required: true,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
});

const userModel = mongoose.model("User", userSchema);
export default userModel;
```

### Chat Schema (`backend/src/models/chat.model.js`)
Represents individual conversation threads initiated by users.
```javascript
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const chatModel = mongoose.model("Chat", chatSchema);
export default chatModel;
```

### Message Schema (`backend/src/models/message.model.js`)
Maintains historical records of user inputs and generated AI replies within a specific chat session.
```javascript
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  sender: {
    type: String,
    enum: ["user", "ai"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const messageModel = mongoose.model("Message", messageSchema);
export default messageModel;
```

---

## 4. Backend Source Code Context

### Server Entry (`backend/server.js`)
```javascript
import app from "./src/app.js";
import config from "./src/config/config.js";
import connectDB from "./src/config/db.js";

connectDB();

const PORT = config.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
```

### Environment Configuration Schema (`backend/src/config/config.js`)
```javascript
import dotenv from "dotenv";

dotenv.config();

const config = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
}

export default config;
```

### Database Connection Handler (`backend/src/config/db.js`)
```javascript
import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error);
    }
};

export default connectDB;
```

### Security Strategy Configuration (`backend/src/config/passport.js`)
Dynamically handles logging in existing accounts or signing up new Google users using passport-google-oauth20.
```javascript
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import userModel from '../models/user.model.js';
import config from './config.js';

export default (passport) => {
  passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://veronicaai-goy5.onrender.com/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Check if user already exists with this Google ID
      let user = await userModel.findOne({ googleId: profile.id });
      if (user) {
        return done(null, user);
      }

      // 2. Check if user exists with the same email
      user = await userModel.findOne({ email: profile.emails[0].value });
      if (user) {
        user.googleId = profile.id;
        if (!user.profilePicture && profile.photos && profile.photos.length > 0) {
          user.profilePicture = profile.photos[0].value;
        }
        await user.save();
        return done(null, user);
      }

      // 3. Create a new user account
      user = await userModel.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        fullname: profile.displayName,
        profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "",
      });

      return done(null, user);
    } catch (error) {
      console.log("Error in passport callback:", error);
      return done(error, null);
    }
  }));
};
```

### Security Session Decryption (`backend/src/middlewares/auth.middleware.js`)
Decrypts cookie-stored JSON Web Tokens.
```javascript
import jwt from "jsonwebtoken";
import config from "../config/config.js";

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
}

export default authMiddleware;
```

### Identity Controller (`backend/src/controller/auth.controller.js`)
Generates cookie payloads post-login and yields user identities.
```javascript
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import userModel from "../models/user.model.js";

const googleAuthCallback = (req, res) => {
  const token = jwt.sign({ id: req.user._id }, config.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token);
  const redirectUrl = process.env.FRONTEND_URL || "";
  res.redirect(`${redirectUrl}/chats`);
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { googleAuthCallback, getMe };
```

### Chat Messaging & Stream Controller (`backend/src/controller/chat.controller.js`)
Features Server-Sent Events (SSE) streaming, title auto-generation, multi-part document parsing, and message tracking.
```javascript
import { getStream, getTitle } from "../services/ai.service.js";
import * as chatDao from "../dao/chat.dao.js";
import { ingestPDF } from "../tools/rag.tool.js";
import fs from "fs";

export async function handleMessage(req, res) {
  const message = req.body.message;
  const { chatId } = req.body;

  // Process and ingest multi-part PDF if attached to message request
  if (req.file) {
    try {
      const pdfPath = req.file.path;
      await ingestPDF(pdfPath);
      fs.unlinkSync(pdfPath);
    } catch (error) {
      console.error("Error ingesting file:", error);
    }
  }

  // Configure response headers for Server-Sent Events (SSE)
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
      res.write(`title: ${JSON.stringify({ title: data.chatTitle, chatId: chat._id })}\n\n`);
      return chat._id;
    }
    return chatId;
  };

  const aiResponse = async () => {
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant. If you don't have the answer to the user's query, use the tool rag_tool to search the document database first, and if not found, use the search_tool to find the answer on the internet. Try to answer only in 100 words or less",
      },
      {
        role: "user",
        content: `${message},\n\ncurrent date is ${new Date().toDateString()}.`,
      },
    ];

    const stream = await getStream(messages);
    let AIResponse = "";

    for await (const chunk of stream) {
      const messageChunk = Array.isArray(chunk) ? chunk[0] : chunk;
      if (messageChunk.getType() === "ai" && messageChunk.content) {
        const aiChunk = messageChunk.content;
        AIResponse += aiChunk;
        res.write(`data: ${JSON.stringify({ chunk: aiChunk })}\n\n`);
      }
    }
    return AIResponse;
  };

  try {
    const [chatIdNew, AIMessage] = await Promise.all([generateTitle(), aiResponse()]);

    await chatDao.saveMessage({
      chatId: chatIdNew,
      sender: "user",
      content: req.file ? `[FILE:${req.file.originalname}]\n\n${message}` : message,
    });

    await chatDao.saveMessage({
      chatId: chatIdNew,
      sender: "ai",
      content: AIMessage || " ",
    });
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
    const formattedMessages = messages.map((m) => ({
      role: m.sender === "ai" ? "assistant" : m.sender,
      content: m.content,
      timestamp: m.createdAt,
    }));
    res.json(formattedMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function deleteChat(req, res) {
  const { chatId } = req.params;
  const userId = req.user.id;
  try {
    const result = await chatDao.deleteChatForUser(chatId, userId);
    if (result) {
      res.json({ message: "Chat deleted successfully" });
    } else {
      res.status(404).json({ message: "Chat not found or unauthorized" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
```

### Data Access Object (`backend/src/dao/chat.dao.js`)
Consolidates Mongoose atomic requests. Includes cascade operations ensuring orphaned message records are immediately deleted when a chat session is removed.
```javascript
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";

export async function createChat({ title, user }) {
    return await chatModel.create({ title, user });
}

export async function saveMessage({ chatId, sender, content }) {
    return await messageModel.create({ chatId, sender, content });
}

export async function getAllChatsForUser(userId) {
    return await chatModel.find({ user: userId }).sort({ createdAt: -1 });
}

export async function getMessagesForChat(chatId) {
    return await messageModel.find({ chatId }).sort({ createdAt: 1 });
}

export async function deleteChatForUser(chatId, userId) {
    const deletedChat = await chatModel.findOneAndDelete({ _id: chatId, user: userId });
    if (deletedChat) {
        await messageModel.deleteMany({ chatId });
    }
    return deletedChat;
}
```

---

## 5. RAG & AI Agent Orchestration Pipeline

The RAG stack uses **LangChain**, **Mistral AI Embeddings**, and the **Pinecone Vector Database** to perform dynamic context retrieval.

### Vector Search and Ingestion (`backend/src/tools/rag.tool.js`)
This tool manages indexing parsed text, querying similarities, and inserting high-dimensional embeddings into Pinecone.

> [!IMPORTANT]
> The **Pinecone Javascript SDK v7+** strictly expects an options object containing a `records` property (`index.upsert({ records })`) rather than passing the raw array directly as a flat parameters list.

```javascript
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { v4 as uuidv4 } from "uuid";
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
    const index = pinecone.Index("kodr-rag");
    const vector = await embeddings.embedQuery(query);
    const queryResult = await index.query({
      vector,
      topK: 2,
      includeMetadata: true,
    });

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

export async function ingestPDF(pdfPath) {
  try {
    const loader = new PDFLoader(pdfPath, { splitPages: true });
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
    const upsertResult = await index.upsert({ records }); // Pinecone SDK v7 options format
    return upsertResult;
  } catch (error) {
    console.error("Error in ingestPDF:", error);
    throw error;
  }
}
```

### Tavily Web Search Tool (`backend/src/tools/search.tool.js`)
```javascript
import { tavily } from "@tavily/core";
import config from "../config/config.js";

const tavilyClient = tavily({
  apiKey: config.TAVILY_API_KEY,
});

export async function searchWeb({ query }) {
  try {
    const response = await tavilyClient.search(query, { maxResults: 5 });
    const result = response.results.map((r) => r.content);
    return result.join("\n\n --- \n\n");
  } catch (error) {
    console.error("Error in searchWeb:", error);
    throw error;
  }
}
```

### Agent Orchestration Layer (`backend/src/services/ai.service.js`)
Wraps custom search and RAG functions as LangChain tools, instantiates `ChatMistralAI` agent boundaries, streams responses, and generates structured chat titles using JSON tool formatting schema limits.
```javascript
import { ChatMistralAI } from "@langchain/mistralai";
import { createAgent, toolStrategy, tool } from "langchain";
import z from "zod";
import { searchWeb } from "../tools/search.tool.js";
import { ragSearch } from "../tools/rag.tool.js";
import config from "../config/config.js";

const search_tool = tool(searchWeb, {
  name: "search_tool",
  description: "Use this tool to find latest information on the internet. Mandatory to use this tool if you don't have the information about user query.",
  schema: z.object({
    query: z.string().describe("The search query to find information about"),
  }),
});

const rag_tool = tool(ragSearch, {
  name: "rag_tool",
  description: "Use this tool to search through the specific document database or internship details.",
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
  return await agent.stream({ messages }, { streamMode: "messages" });
}

export async function generateResponse(messages) {
  return await model.invoke(messages);
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

  return response.structuredResponse;
}
```

---

## 6. Frontend State & Components (Next.js 16 SPA)

The UI is built using **Redux Toolkit** for state management, **Vanilla CSS**, and **React Markdown**.

### Redux Core Configuration (`frontend/src/app/app.store.js`)
```javascript
import { configureStore } from '@reduxjs/toolkit'
import chatReducer from "./chats/slice/chat.slice"

export const store = configureStore({
    reducer: {
        chat: chatReducer
    }
})
```

### Store Wrapper Context (`frontend/src/app/StoreProvider.jsx`)
```javascript
"use client";

import { Provider } from "react-redux";
import { store } from "./app.store";

export default function StoreProvider({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
```

### Chat Slice (`frontend/src/app/chats/slice/chat.slice.js`)
Manages real-time state for active chat, all chats, messages, and user profile data.
```javascript
import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [],
    activeChatId: null,
    allChats: [],
    user: null,
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    appendContentToLastMessage: (state, action) => {
      state.messages[state.messages.length - 1].content += action.payload.chunk;
    },
    setActiveChatId: (state, action) => {
      state.activeChatId = action.payload;
    },
    addNewChat: (state, action) => {
      if (!state.allChats.some(c => c._id === action.payload._id)) {
        state.allChats.unshift(action.payload);
      }
    },
    clearChat: (state) => {
      state.messages = [];
      state.activeChatId = null;
    },
    setAllChats: (state, action) => {
      state.allChats = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    removeChat: (state, action) => {
      state.allChats = state.allChats.filter(c => c._id !== action.payload);
      if (state.activeChatId === action.payload) {
        state.messages = [];
        state.activeChatId = null;
      }
    },
  },
});

export const {
  addMessage,
  appendContentToLastMessage,
  setActiveChatId,
  addNewChat,
  clearChat,
  setAllChats,
  setMessages,
  setUser,
  removeChat,
} = chatSlice.actions;

export default chatSlice.reducer;
```

### Custom Interfacing Hook (`frontend/src/app/chats/hooks/useChat.js`)
Decouples UI component operations from Redux state dispatchers and custom API integrations.
```javascript
import { sendMessage, getAllChats, getChatMessages, getUser, deleteChat } from "../service/chat.api";
import {
  appendContentToLastMessage,
  addMessage,
  setActiveChatId,
  addNewChat,
  setAllChats,
  setMessages,
  setUser,
  removeChat
} from "../slice/chat.slice.js";
import { useDispatch, useSelector } from "react-redux";

export const useChat = () => {
  const dispatch = useDispatch();
  const { activeChatId } = useSelector((state) => state.chat);

  const handleSendMessage = async (userInput, webSearch = false, file = null) => {
    dispatch(
      addMessage({
        role: "user",
        content: file ? `[FILE:${file.name}]\n\n${userInput}` : userInput,
        timestamp: Date.now(),
      }),
    );
    dispatch(
      addMessage({
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      }),
    );

    sendMessage(
      userInput,
      activeChatId,
      ({ chunk }) => {
        dispatch(appendContentToLastMessage({ chunk }));
      },
      ({ chatId, title }) => {
        dispatch(setActiveChatId(chatId));
        dispatch(addNewChat({ _id: chatId, title }));
        fetchChats();
      },
      webSearch,
      file
    );
  };

  const fetchChats = async () => {
    try {
      const chats = await getAllChats();
      if (Array.isArray(chats)) {
        dispatch(setAllChats(chats));
      } else {
        dispatch(setAllChats([]));
      }
    } catch (error) {
      console.error(error);
      dispatch(setAllChats([]));
    }
  }

  const fetchChatMessages = async (chatId) => {
    try {
      const messages = await getChatMessages(chatId);
      if (Array.isArray(messages)) {
        dispatch(setMessages(messages));
      } else {
        dispatch(setMessages([]));
      }
    } catch (error) {
      console.error(error);
      dispatch(setMessages([]));
    }
  }

  const fetchUserData = async () => {
    try {
      const user = await getUser();
      if (user && !user.message) {
        dispatch(setUser(user));
      } else {
        dispatch(setUser(null));
      }
    } catch (error) {
      console.error(error);
      dispatch(setUser(null));
    }
  }

  const handleDeleteChat = async (chatId) => {
    try {
      const res = await deleteChat(chatId);
      if (res && res.message) {
        dispatch(removeChat(chatId));
      }
    } catch (error) {
      console.error(error);
    }
  }

  return {
    handleSendMessage,
    fetchChats,
    fetchChatMessages,
    fetchUserData,
    handleDeleteChat
  };
};
```

### Chat API Wrapper (`frontend/src/app/chats/service/chat.api.js`)
Manages HTTP requests, multipart form-data formatting for PDF files, and parses Server-Sent Events (SSE) line-by-line using `TextDecoder` and `for await...of` on `response.body`.
```javascript
export async function sendMessage(userInput, chatId = null, onChunk = (chunk) => {}, onNewChat = (chatData) => {}, webSearch = false, file = null) {
  const endpoint = "/api/chat";
  let body;
  let headers = {};

  if (file) {
    body = new FormData();
    body.append("message", userInput);
    if (chatId) body.append("chatId", chatId);
    body.append("pdf", file);
  } else {
    body = JSON.stringify({ message: userInput, chatId });
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    credentials: "include",
    body,
  });

  const decoder = new TextDecoder();
  for await (const chunk of response.body) {
    const text = decoder.decode(chunk);
    const lines = text.split("\n\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.replace("data: ", "");
        const data = JSON.parse(jsonStr);
        onChunk(data);
      } else if (line.startsWith("title: ")) {
        const jsonStr = line.replace("title: ", "");
        const data = JSON.parse(jsonStr);
        onNewChat(data);
      }
    }
  }
}

export async function getAllChats() {
  const response = await fetch("/api/chat/allChats", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return await response.json();
}

export async function getChatMessages(chatId) {
  const response = await fetch(`/api/chat/messages/${chatId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return await response.json();
}

export async function getUser() {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return await response.json();
}

export async function deleteChat(chatId) {
  const response = await fetch(`/api/chat/${chatId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return await response.json();
}
```

### Core Sidebar Component (`frontend/src/app/chats/components/Sidebar.jsx`)
Features a slide-out drawer list containing active sessions, custom deletion triggers, and a profile settings tray.

> [!NOTE]
> Flex container layout rules have been customized here: `shrink-0 relative z-20` is explicitly set on active elements to prevent flex box items from compressing to `0px` width when placed next to long text boundaries.

```javascript
"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  MessageSquare,
  Settings,
  PanelLeftClose,
  Trash2,
} from "lucide-react";
import { setActiveChatId, clearChat } from "../slice/chat.slice";
import { useChat } from "../hooks/useChat.js";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const dispatch = useDispatch();
  const { activeChatId, allChats, user } = useSelector((state) => state.chat);
  const { fetchChats, fetchChatMessages, fetchUserData, handleDeleteChat: deleteChatHook } = useChat();

  useEffect(() => {
    fetchChats();
    fetchUserData();
  }, []);

  const handleNewChat = () => {
    dispatch(clearChat());
  };

  const handleSelectChat = (id) => {
    dispatch(setActiveChatId(id));
    fetchChatMessages(id);
  };

  const handleDeleteChat = (e, id) => {
    e.stopPropagation();
    deleteChatHook(id);
  };

  return (
    <aside className={`fixed md:relative top-0 left-0 h-full bg-black flex flex-col transition-all duration-300 ease-in-out z-30 
      ${isOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full overflow-hidden md:w-0 md:translate-x-0"}`}>
      
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium text-gray-200 text-xl">Veronica</span>
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400" title="Close sidebar">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
        <div className="w-full h-px bg-violet-300/40 mb-4"></div>
        <button onClick={handleNewChat} className="flex items-center justify-start gap-2.5 w-full bg-[#2c292e] text-white py-2 px-4 rounded-md">
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      <span className="text-gray-400 text-sm mb-2 ml-4 mt-4">Chats</span>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2">
        {!allChats || allChats.length === 0 ? (
          <div className="text-center text-xs text-gray-500 mt-8">No chats found</div>
        ) : (
          <div className="flex flex-col gap-1">
            {allChats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => handleSelectChat(chat._id)}
                className={`relative group flex items-center justify-between gap-2 overflow-hidden px-3 py-2.5 rounded-md cursor-pointer text-sm
                  ${activeChatId === chat._id ? "bg-linear-to-r from-transparent to-[#7f3c92] text-white" : "text-gray-200 hover:bg-violet-200/20"}`}
              >
                <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate pr-2 font-medium">{chat.title}</span>
                </div>
                
                {/* Protected shrink-0 element to prevent truncation overlap squishing */}
                <button
                  onClick={(e) => handleDeleteChat(e, chat._id)}
                  className={`shrink-0 relative z-20 p-1 rounded-md transition-all duration-200 
                    ${activeChatId === chat._id ? "text-white bg-black/50" : "text-gray-200 bg-black/20"}`}
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-[#12141A]/30 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img src={user?.profilePicture} alt="" className="w-9 h-9 rounded-xl" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-gray-200 truncate">{user?.fullname}</span>
            <span className="text-[10px] text-gray-500 truncate">{user?.email}</span>
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
```

---

## 7. Configuration & Deployment Strategies

### Monolithic NPM Dependency Mapping (`package.json`)
The monolithic root contains dependencies designed to support both frontend export and Express execution:
- Build Commands:
  ```json
  "scripts": {
    "build:frontend": "cd frontend && npm install && npm run build",
    "build": "npm run build:frontend && rm -rf public && cp -r frontend/out public",
    "start": "node backend/server.js"
  }
  ```

### permanent Dependency Resolvers (`.npmrc`)
To permanently bypass version mismatches caused by library dependency version ranges (e.g. Zod v3 vs v4 in community LangChain packages), custom `.npmrc` files are configured at both the root and `backend/` levels:
```ini
legacy-peer-deps=true
```

### Docker Containers (`docker-compose.yml`)
Orchestrates isolated microservice runtimes for localized testing.
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: dockerfile
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://mongodb:27017/SenseAI
    depends_on:
      - mongodb

  frontend:
    build:
      context: ./frontend
      dockerfile: dockerfile
    ports:
      - "3000:3000"

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### Render Deployment Configuration
When deployed on **Render**:
1. **Environment Variables**:
   - `GOOGLE_CALLBACK_URL`: `https://veronicaai-goy5.onrender.com/api/auth/google/callback`
   - `FRONTEND_URL`: `https://veronicaai-goy5.onrender.com`
   - `MONGO_URI`, `JWT_SECRET`, `MISTRAL_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PINECONE_API_KEY` defined accordingly.
2. **Build Command**: `npm run build`
3. **Start Command**: `npm run start`

---

## 8. Summary of Custom Solutions & Enhancements

When extending or maintaining this project, keep in mind these key architectural enhancements that were introduced:

1. **Express 5.x Wildcard Constraints**: Under Express 5.x, using the standard wildcard symbol `*` for catch-all middleware throws runtime `PathError` exceptions. SPA fallback routing is securely implemented using a functional catch-all callback instead:
   ```javascript
   app.use((req, res) => {
     res.sendFile(path.join(publicPath, "index.html"));
   });
   ```
2. **Pinecone JS SDK v7 Ingestion Option wrapping**: The latest Pinecone upsert logic expects record collections to be structured within an index request options container (`index.upsert({ records })`) to satisfy TypeScript compiler typings.
3. **Flexbox Compression Overlay Protections**: Sub-elements (such as deletion buttons or active icons) placed adjacent to dynamic text borders inside lists are shielded with CSS selectors `shrink-0 relative z-20` to prevent flexbox layouts from collapsing active sizes.
4. **NPM Resolution Stability**: To avoid blocking deployment processes with package resolutions, both `backend/` and core workspace directories use `.npmrc` files specifying `legacy-peer-deps=true`.
