import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { blogController } from "../controllers/blog.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Create blog
router.post("/create", asyncHandler(blogController.createBlog));

// ✅ Get all blogs (with filters/pagination)
router.get("/", authMiddleware ,asyncHandler(blogController.getAllBlogs));

// ✅ Get single blog by ID
router.get("/:id", asyncHandler(blogController.getBlog));

// ✅ Update blog
router.put("/:id", asyncHandler(blogController.updateBlog));

// ✅ Delete blog
router.delete("/:id", asyncHandler(blogController.deleteBlog));

// ✅ Like blog
router.post("/:id/like", asyncHandler(blogController.likeBlog));

// ✅ Bookmark blog
router.post("/:id/bookmark", asyncHandler(blogController.bookmarkBlog));

// Comment blog
router.post("/:id/comment", asyncHandler(blogController.commentBlog));

// Update comment
router.post("/:id/comment", asyncHandler(blogController.updateCommentBlog));

export default router;