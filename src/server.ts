import express from "express";
import dotenv from "dotenv";
import { errorhandler } from "./middlewares/error.middleware.js";
import cors from "cors";
import blogRoutes from "./routes/blog.routes.js";
import imageRoutes from "./routes/image.route.js";

dotenv.config();

const app = express();
app.use(express.json());
// Parse trusted origins from env
const allowedOrigins = (process.env.TRUSTED_ORIGINS as string).split(",");

// CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g., Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // important for cookies
  })
);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Everything iss working fine" });
});

app.use('/api/blog', blogRoutes);
app.use('/api/image', imageRoutes);

app.use(errorhandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Blog service is listening on port ${PORT}`);
});
