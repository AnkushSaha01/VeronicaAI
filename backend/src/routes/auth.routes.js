import { Router } from "express";
import passport from "passport";
import { googleAuthCallback, getMe } from "../controller/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";


const authRouter = Router();



authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }),(req,res) => {
    res.redirect("/");
});
authRouter.get("/google/callback", passport.authenticate("google", { failureRedirect: "/", session: false }), googleAuthCallback);

authRouter.get("/me",authMiddleware, getMe);

export default authRouter;