import app from "./src/app.js";
import config from "./src/config/config.js";
import connectDB from "./src/config/db.js";


connectDB();

if (!process.env.VERCEL) {
    app.listen(config.PORT, () => {
        console.log(`Server running on port ${config.PORT}`);
    });
}

export default app;