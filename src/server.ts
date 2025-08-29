import express from "express";
import dotenv from "dotenv";
import { errorhandler } from "./middlewares/error.middleware.js";
import cors from "cors";
import blogRoutes from "./routes/blog.routes.js";
import imageRoutes from "./routes/image.route.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
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
