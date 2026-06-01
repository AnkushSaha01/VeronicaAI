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
        console.error("fetchChats failed: response is not an array", chats);
        dispatch(setAllChats([]));
      }
    } catch (error) {
      console.error("fetchChats error:", error);
      dispatch(setAllChats([]));
    }
  }

  const fetchChatMessages = async (chatId) => {
    try {
      const messages = await getChatMessages(chatId);
      if (Array.isArray(messages)) {
        dispatch(setMessages(messages));
      } else {
        console.error("fetchChatMessages failed: response is not an array", messages);
        dispatch(setMessages([]));
      }
    } catch (error) {
      console.error("fetchChatMessages error:", error);
      dispatch(setMessages([]));
    }
  }

  const fetchUserData = async () => {
    try {
      const user = await getUser();
      if (user && !user.message) {
        dispatch(setUser(user));
      } else {
        console.error("fetchUserData failed:", user);
        dispatch(setUser(null));
      }
    } catch (error) {
      console.error("fetchUserData error:", error);
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
      console.error("handleDeleteChat error:", error);
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
