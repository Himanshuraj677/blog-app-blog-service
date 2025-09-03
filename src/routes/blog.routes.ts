import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { blogController } from "../controllers/blog.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { ownershipMiddleware } from "../middlewares/ownership.middleware.js";
import { checkResourceOwnership } from "../utils/checkResourceOwnership.js";

const router = Router();

// ✅ Create blog
router.post("/create", authMiddleware({optional: false}), ownershipMiddleware(["admin", "editor", "author"]), asyncHandler(blogController.createBlog));

// ✅ Get all blogs (with filters/pagination)
router.get("/", authMiddleware({optional: true}), asyncHandler(blogController.getAllBlogs));

// ✅ Get single blog by ID
router.get("/:id", authMiddleware({optional: true}), asyncHandler(blogController.getBlog));

// ✅ Update blog
router.put("/:id", authMiddleware({optional: false}), ownershipMiddleware(["admin", "editor"], checkResourceOwnership.blog), asyncHandler(blogController.updateBlog));

// ✅ Delete blog
router.delete("/:id", authMiddleware({optional: false}), ownershipMiddleware(["admin", "editor"], checkResourceOwnership.blog), asyncHandler(blogController.deleteBlog));

// ✅ Like blog
router.post("/:id/like", authMiddleware({optional: false}), asyncHandler(blogController.likeBlog));

// ✅ Bookmark blog
router.post("/:id/bookmark", authMiddleware({optional: false}), asyncHandler(blogController.bookmarkBlog));

// Comment blog
router.post("/:id/comment", authMiddleware({optional: false}), asyncHandler(blogController.commentBlog));

// Update comment
router.put("/:id/comment", authMiddleware({optional: false}), ownershipMiddleware(["admin", "editor"], checkResourceOwnership.comment), asyncHandler(blogController.updateCommentBlog));

// Delete comment
router.delete("/:id/comment", authMiddleware({optional: false}), ownershipMiddleware(["admin", "editor"], checkResourceOwnership.comment), asyncHandler(blogController.deleteCommentBlog));

export default router;