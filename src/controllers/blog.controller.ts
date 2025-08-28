import { NextFunction, Request, Response } from "express";
import { readingTimeFromTiptap } from "../utils/readingTimeEstimator";
import { prisma } from "../config/db";

export const blogController = {
  // ✅ Create Blog
  createBlog: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, content, excerpt, tags, status, featuredImage } = req.body;
      if (!title || !content || !excerpt || !status || !featuredImage) {
        return res
          .status(406)
          .json({ success: false, error: "All fields are compulsory!" });
      }

      const readingTime = readingTimeFromTiptap(content);
      const engagement = {
        likes: 0,
        bookmarks: 0,
        comments: 0,
        views: 0,
        shares: 0,
      };

      const payload = {
        title,
        content,
        excerpt,
        authorId: req?.user?.id || "7477474",
        author: req?.user?.name || "Anonymous user",
        tags,
        status,
        featuredImage,
        readingTime,
        engagement,
        publishedAt: status === "published" ? new Date() : null,
      };

      const blog = await prisma.blog.create({ data: payload });

      return res.status(201).json({
        success: true,
        message: "Blog is created successfully",
        data: blog,
      });
    } catch (error) {
      next(error);
    }
  },

  // ✅ Get single blog by ID
  getBlog: async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const blog = await prisma.blog.findUnique({ where: { id } });

      if (!blog) {
        return res.status(404).json({ success: false, error: "Blog not found" });
      }

      // Increment views count
      await prisma.blog.update({
        where: { id },
        data: { engagement: { ...blog.engagement as Json, views: blog.engagement.views + 1 } },
      });

      return res.status(200).json({ success: true, data: blog });
  },

  // ✅ Get all blogs (with filters and pagination)
  getAllBlogs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, tag, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const blogs = await prisma.blog.findMany({
        where: {
          status: status ? String(status) : undefined,
          tags: tag ? { has: String(tag) } : undefined,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      });

      return res.status(200).json({ success: true, data: blogs });
    } catch (error) {
      next(error);
    }
  },

  // ✅ Update blog
  updateBlog: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { title, content, excerpt, tags, status, featuredImage } = req.body;

      const blog = await prisma.blog.findUnique({ where: { id } });
      if (!blog) {
        return res.status(404).json({ success: false, error: "Blog not found" });
      }

      const readingTime = content ? readingTimeFromTiptap(content) : blog.readingTime;

      const updatedBlog = await prisma.blog.update({
        where: { id },
        data: {
          title: title ?? blog.title,
          content: content ?? blog.content,
          excerpt: excerpt ?? blog.excerpt,
          tags: tags ?? blog.tags,
          status: status ?? blog.status,
          featuredImage: featuredImage ?? blog.featuredImage,
          readingTime,
          publishedAt: status === "published" ? new Date() : blog.publishedAt,
        },
      });

      return res
        .status(200)
        .json({ success: true, message: "Blog updated successfully", data: updatedBlog });
    } catch (error) {
      next(error);
    }
  },

  // ✅ Delete blog
  deleteBlog: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const blog = await prisma.blog.findUnique({ where: { id } });

      if (!blog) {
        return res.status(404).json({ success: false, error: "Blog not found" });
      }

      await prisma.blog.delete({ where: { id } });

      return res.status(200).json({ success: true, message: "Blog deleted successfully" });
    } catch (error) {
      next(error);
    }
  },

  // ✅ Like blog
  likeBlog: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const blog = await prisma.blog.findUnique({ where: { id } });

      if (!blog) {
        return res.status(404).json({ success: false, error: "Blog not found" });
      }

      const updatedBlog = await prisma.blog.update({
        where: { id },
        data: { engagement: { ...blog.engagement, likes: blog.engagement.likes + 1 } },
      });

      return res.status(200).json({ success: true, data: updatedBlog });
    } catch (error) {
      next(error);
    }
  },

  // ✅ Bookmark blog
  bookmarkBlog: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const blog = await prisma.blog.findUnique({ where: { id } });

      if (!blog) {
        return res.status(404).json({ success: false, error: "Blog not found" });
      }

      const updatedBlog = await prisma.blog.update({
        where: { id },
        data: { engagement: { ...blog.engagement, bookmarks: blog.engagement.bookmarks + 1 } },
      });

      return res.status(200).json({ success: true, data: updatedBlog });
    } catch (error) {
      next(error);
    }
  },
};
