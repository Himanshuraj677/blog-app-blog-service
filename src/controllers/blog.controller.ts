import { NextFunction, Request, Response } from "express";
import { readingTimeFromTiptap } from "../utils/readingTimeEstimator.js";
import { prisma } from "../config/db.js";
import { success } from "zod";

export const blogController = {
  // ✅ Create Blog
  createBlog: async (req: Request, res: Response, next: NextFunction) => {
    const { title, content, excerpt, tags, status, featuredImage } = req.body;
    if (!title || !content || !excerpt || !status || !featuredImage) {
      return res
        .status(406)
        .json({ success: false, error: "All fields are compulsory!" });
    }

    const readingTime = readingTimeFromTiptap(content);

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
      views: 0,
      publishedAt: status === "published" ? new Date() : null,
    };

    const blog = await prisma.blog.create({ data: payload });

    return res.status(201).json({
      success: true,
      message: "Blog is created successfully",
      data: blog,
    });
  },

  // ✅ Get single blog by ID
  getBlog: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        bookmarks: {
          select: { id: true },
        },
        likes: {
          select: { id: true },
        },
        comments: {
          select: { id: true },
        },
      },
    });

    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: { views: blog.views + 1 },
    });

    const blogWithEngagement = {
      ...blog,
      engagement: { 
        likes: blog.likes.length,
        views: updatedBlog.views,
        comments: blog.comments.length,
        bookmarks: blog.bookmarks.length
      },
    };
    return res.status(200).json({ success: true, data: blogWithEngagement });
  },

  // ✅ Get all blogs (with filters and pagination)
  getAllBlogs: async (req: Request, res: Response, next: NextFunction) => {
    const { status, tag, page = "1", limit = "10" } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count of blogs matching filter
    const totalBlogs = await prisma.blog.count({
      where: {
        status: status ? String(status) : undefined,
        tags: tag ? { has: String(tag) } : undefined,
      },
    });

    // Fetch paginated blogs
    const blogs = await prisma.blog.findMany({
      where: {
        status: status ? String(status) : undefined,
        tags: tag ? { has: String(tag) } : undefined,
      },
      include: {
        bookmarks: {
          select: { id: true },
        },
        likes: {
          select: { id: true },
        },
        comments: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    });

    const blogWithEngagement = blogs.map((blog) => (
      {
      ...blog,
      engagement: { 
        likes: blog.likes.length,
        views: blog.views + 1,
        comments: blog.comments.length,
        bookmarks: blog.bookmarks.length
      },
    }
    ))

    const totalPages = Math.ceil(totalBlogs / limitNum);

    return res.status(200).json({
      success: true,
      data: blogWithEngagement,
      pagination: {
        total: totalBlogs,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  },

  // ✅ Update blog
  updateBlog: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { title, content, excerpt, tags, status, featuredImage } = req.body;

    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }

    const readingTime = content
      ? readingTimeFromTiptap(content)
      : blog.readingTime;

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

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  },

  // ✅ Delete blog
  deleteBlog: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const blog = await prisma.blog.findUnique({ where: { id } });

    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }

    await prisma.blog.delete({ where: { id } });

    return res
      .status(200)
      .json({ success: true, message: "Blog deleted successfully" });
  },

  // ✅ Like blog
  likeBlog: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    console.log(id);
    const blog = await prisma.blog.findUnique({ where: { id } });

    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }

    const likeBlog = await prisma.like.create({
      data: {
        blogId: id,
        userId: req?.user?.id || "someanonymoususer",
      },
    });


    return res.status(200).json({ success: true, data: likeBlog });
  },

  // ✅ Bookmark blog
  bookmarkBlog: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const blog = await prisma.blog.findUnique({ where: { id } });

    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }

    const bookmarkBlog = await prisma.bookmarks.create({
      data: {
        blogId: id,
        userId: req?.user?.id || "someanonymoususer",
      },
    });

    return res.status(200).json({ success: true, data: bookmarkBlog });
  },

  commentBlog: async (req: Request, res: Response, next: NextFunction) => {
    const {id} = req.params;
    const {comment: content} = req.body;
    const commentBlog = await prisma.comment.create({
      data: {
        blogId: id,
        userId: req?.user?.id || "someanonymoususer",
        content
      }
    });

    return res.status(200).json({success: true, data: commentBlog})
  },

  updateCommentBlog: async(req: Request, res: Response, next: NextFunction) => {
    const {id} = req.params;
    const {comment: content} = req.body; 
    const upadtedComment = await prisma.comment.update({
      where: {id},
      data: {
        content,
      }
    });

    return res.status(200).json({success: true, data: upadtedComment});
  }
};
