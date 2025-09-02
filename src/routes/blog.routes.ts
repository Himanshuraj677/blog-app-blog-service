import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { blogController } from "../controllers/blog.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { ownershipMiddleware } from "../middlewares/ownership.middleware.js";
import { checkResourceOwnership } from "../utils/checkResourceOwnership.js";

const router = Router();

// ✅ Create blog
router.post("/create", authMiddleware, ownershipMiddleware(["admin", "editor", "author"]), asyncHandler(blogController.createBlog));

// ✅ Get all blogs (with filters/pagination)
router.get("/", asyncHandler(blogController.getAllBlogs));

// ✅ Get single blog by ID
router.get("/:id", asyncHandler(blogController.getBlog));

// ✅ Update blog
router.put("/:id", authMiddleware, ownershipMiddleware(["admin", "editor"], checkResourceOwnership.blog), asyncHandler(blogController.updateBlog));

// ✅ Delete blog
router.delete("/:id", authMiddleware, ownershipMiddleware(["admin", "editor"], checkResourceOwnership.blog), asyncHandler(blogController.deleteBlog));

// ✅ Like blog
router.post("/:id/like", authMiddleware, asyncHandler(blogController.likeBlog));

// ✅ Bookmark blog
router.post("/:id/bookmark", authMiddleware, asyncHandler(blogController.bookmarkBlog));

// Comment blog
router.post("/:id/comment", authMiddleware, asyncHandler(blogController.commentBlog));

// Update comment
router.put("/:id/comment", authMiddleware, ownershipMiddleware(["admin", "editor"], checkResourceOwnership.comment), asyncHandler(blogController.updateCommentBlog));

// Delete comment
router.delete("/:id/comment", authMiddleware, ownershipMiddleware(["admin", "editor"], checkResourceOwnership.comment), asyncHandler(blogController.deleteCommentBlog));

export default router;