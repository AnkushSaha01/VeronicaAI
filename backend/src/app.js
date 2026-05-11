import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import chatRoutes from "./routes/chat.routes.js";
import passport from "passport";
import configurePassport from "./config/passport.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// Middlewares
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(cookieParser());



// Passport configuration
configurePassport(passport);
app.use(passport.initialize());

// Routes
// app.use("/api", (req, res) => {
//   res.send("api is working");
// });

// let messages = [];

// app.post("/chat", async (req, res) => {
//   let userInp = req.body.message;
//   messages.push({ role: "user", content: userInp });

//   const content = await generateResponse(messages);
//   let ans = content.lc_kwargs.content;
//   messages.push({ role: "assistant", content: ans });
//   res.json({ ans });
// });

app.use("/api/chat", chatRoutes)
app.use("/api/auth", authRoutes)  

export default app;
