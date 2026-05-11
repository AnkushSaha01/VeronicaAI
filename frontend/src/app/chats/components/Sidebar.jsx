"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Sparkles,
  Plus,
  MessageSquare,
  Settings,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
  Trash2,
  User,
} from "lucide-react";
import { setActiveChatId, clearChat } from "../slice/chat.slice";
import { useEffect } from "react";
import { useChat } from "../hooks/useChat.js";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const dispatch = useDispatch();
  const { activeChatId, allChats, user } = useSelector((state) => state.chat);

  const { fetchChats, fetchChatMessages, fetchUserData } = useChat();
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
    // Placeholder for future delete integration
    console.log("Delete chat:", id);
  };

  return (
    <aside
      className={`fixed md:relative top-0 left-0 h-full bg-black  flex flex-col transition-all duration-300 ease-in-out z-30 
                ${isOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden"}
            `}
    >
      {/* Header / New Chat */}
      <div className="p-4 flex flex-col gap-4 ">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* <div className="bg-white p-1 rounded-md">
              <Sparkles className="w-4 h-4 text-[#12141A] fill-[#12141A]" />
            </div> */}
            <span className="font-medium text-gray-200  text-xl">
              Varonica
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
        <div className="w-full h-px bg-violet-300/40 mb-4"></div>

        <button
          onClick={handleNewChat}
          className="flex items-center justify-start gap-2.5 w-full bg-[#2c292e] hover:bg-[#3b373d] text-white  py-2 px-4 rounded-md transition-all duration-200 text-md  shadow-md hover:scale-[1.01]"
        >
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <span className="text-gray-400 text-sm mb-2 ml-4 mt-4">Chats</span>
      <div className="flex-1 overflow-y-auto  no-scrollbar px-4 py-2">
        {!allChats || !Array.isArray(allChats) || allChats.length === 0 ? (
          <div className="text-center text-xs text-gray-500 mt-8 px-4">
            No chats found
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {allChats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => handleSelectChat(chat._id)}
                className={`relative group flex items-center justify-between gap-2 overflow-hidden px-3 py-2.5 rounded-md cursor-pointer transition-all text-sm
                                      ${
                                        activeChatId === chat._id
                                          ? "bg-linear-to-r from-transparent to-[#7f3c92] text-white "
                                          : "text-gray-200 hover:bg-violet-200/20 hover:text-gray-200 "
                                      }
                                  `}
              >
                {activeChatId === chat._id && (
                  <div className="absolute right-0 top-0 h-full w-10 bg-linear-to-l from-[#f0b8ff]/50 to-transparent blur-sm pointer-events-none"></div>
                )}
                <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={`w-4 h-4 shrink-0 ${activeChatId === chat._id ? "text-white" : "text-gray-200"}`}
                  />
                  <span className="truncate pr-2 font-medium">
                    {chat.title}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat._id)}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded-md hover:text-white hover:bg-red-400 transition-all duration-200 ${activeChatId === chat._id ? "text-white" : "text-gray-200"}`}
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile / Settings Footer */}
      <div className="p-4 border-t border-white/5 bg-[#12141A]/30 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {/* <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium shadow-md shrink-0">
            <User className="w-4 h-4" />
          </div> */}
          <img
            src={user?.profilePicture}
            alt=""
            className="w-9 h-9 rounded-xl"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-gray-200 truncate">
              {user?.fullname}
            </span>
            <span className="text-[10px] text-gray-500 truncate">
              {user?.email}
            </span>
          </div>
        </div>
        <button
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
