import { configureStore } from '@reduxjs/toolkit'
import chatReducer from "./chats/slice/chat.slice"

export const store = configureStore({
    reducer: {
        chat: chatReducer
    }
})