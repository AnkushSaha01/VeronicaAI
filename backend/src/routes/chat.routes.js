import { Router } from "express";
import { handleMessage, getChats, getMessages } from "../controller/chat.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, handleMessage);
// router.post("/search", authMiddleware, getAnswerWithInternetAccess);
router.get("/allChats", authMiddleware, getChats);
router.get("/messages/:chatId", authMiddleware, getMessages);


export default router;