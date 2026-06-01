import jwt from "jsonwebtoken";
import config from "../config/config.js";
import userModel from "../models/user.model.js";

const googleAuthCallback = (req, res) => {
  // Generate JWT token
  const token = jwt.sign(
    {
      id: req.user._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  // Set token in an HTTP-only cookie (adjust domain/secure settings as needed for production)
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // ✅ correct
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Grab the explicit message set by Passport
  // const authMsg = req.user.authMessage || "loggedIn";

  // Redirect to frontend
  const redirectUrl = "https://veronicaai-1.onrender.com";
  res.redirect(`${redirectUrl}/chats`);
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { googleAuthCallback, getMe };
