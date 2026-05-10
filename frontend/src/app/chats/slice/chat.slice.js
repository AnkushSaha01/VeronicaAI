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
      /**
       * action.payload = {
       *   role: "user" | "assistant",
       *   content: "message content",
       *   timestamp: Date.now()
       * }
       */
      state.messages.push(action.payload);
    },
    appendContentToLastMessage: (state, action) => {
      /**
       * action.payload = {
       *   chunk: "new chunk of content to be appended to the last message"
       * }
       */
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
} = chatSlice.actions;

export default chatSlice.reducer;

/**
 * messages:[
 * {
 *   role: "user" | "assistant",
 *   content: "message content",
 *   timestamp: Date.now()
 * }
 * ]
 */
