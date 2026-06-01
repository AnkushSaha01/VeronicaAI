import { Router } from "express";
import {
  handleMessage,
  getChats,
  getMessages,
  deleteChat
} from "../controller/chat.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
const router = Router();

router.post("/", authMiddleware, upload.single("pdf"), handleMessage);
// router.post("/search", authMiddleware, getAnswerWithInternetAccess);
router.get("/allChats", authMiddleware, getChats);
router.get("/messages/:chatId", authMiddleware, getMessages);
router.delete("/:chatId", authMiddleware, deleteChat);

export default router;
