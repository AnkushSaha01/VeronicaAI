import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import chatRoutes from "./routes/chat.routes.js";
import passport from "passport";
import configurePassport from "./config/passport.js";
import authRoutes from "./routes/auth.routes.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || true,
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api/chat", chatRoutes)
app.use("/api/auth", authRoutes)  

const publicPath = path.join(__dirname, "../public");


app.use(express.static(publicPath));

// SPA fallback
// app.use((req, res) => {
//   res.sendFile(path.join(publicPath, "index.html"));
// });


app.get(/.*/, (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API route not found" });
  }

  const filePath = path.join(
    __dirname,
    "../public",
    req.path.endsWith("/") ? `${req.path}index.html` : `${req.path}.html`
  );

  res.sendFile(filePath, err => {
    if (err) {
      res.sendFile(path.join(__dirname, "../public/index.html"));
    }
  });
});

export default app;
