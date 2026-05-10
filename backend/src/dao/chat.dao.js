import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";



export async function createChat({ title, user }) {
    const chat = await chatModel.create({ title, user })
    return chat;
}

export async function saveMessage({ chatId, sender, content }) {
    const message = await messageModel.create({ chatId, sender, content })
    return message;
}

export async function getAllChatsForUser(userId) {
    return await chatModel.find({ user: userId }).sort({ createdAt: -1 })
}

export async function getMessagesForChat(chatId) {
    return await messageModel.find({ chatId }).sort({ createdAt: 1 })
}