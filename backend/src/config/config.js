import dotenv from "dotenv";

dotenv.config();



const config = {
    PORT:process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
}

export default config;