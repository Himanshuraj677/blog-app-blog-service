import { NextFunction, Request, Response } from "express";
import { readingTimeFromTiptap } from "../utils/readingTimeEstimator.js";
import { prisma } from "../config/db.js";

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
      authorId: req?.user?.id,
      author: req?.user?.name,
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
    const userId = req?.user?.id;
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        _count: {
          select: {
            bookmarks: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!updatedBlog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }

    let hasLiked = false;
    let hasBookmarked = false;

    if (userId) {
      const [like, bookmark] = await Promise.all([
        prisma.like.findFirst({
          where: { userId, blogId: id },
          select: { id: true },
        }),
        prisma.bookmarks.findFirst({
          where: { userId, blogId: id },
          select: { id: true },
        }),
      ]);

      hasLiked = Boolean(like);
      hasBookmarked = Boolean(bookmark);
    }

    const responseBlog = {
      id: updatedBlog.id,
      title: updatedBlog.title,
      excerpt: updatedBlog.excerpt,
      content: updatedBlog.content,
      tags: updatedBlog.tags,
      readingTime: updatedBlog.readingTime,
      featuredImage: updatedBlog.featuredImage,
      createdAt: updatedBlog.createdAt,
      engagement: {
        likes: updatedBlog._count.likes,
        comments: updatedBlog._count.comments,
        bookmarks: updatedBlog._count.bookmarks,
        views: updatedBlog.views,
      },
      userEngagement: {
        hasLiked,
        hasBookmarked,
      },
      author: {
        id: updatedBlog.authorId,
        name: updatedBlog.author,
        image: updatedBlog.author_image,
      },
    };

    return res.status(200).json({ success: true, data: responseBlog });
  },

  // ✅ Get all blogs (with filters and pagination)
  getAllBlogs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        status = "published",
        tag,
        page = "1",
        limit = "10",
        filter,
      } = req.query;
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      let where: any = {
        status: status ? String(status) : undefined,
        tags: tag ? { has: String(tag) } : undefined,
      };

      if (filter === "mine" && req.user?.id) {
        where.authorId = req.user.id;
      }
      // Handle liked or bookmarked filters
      if ((filter === "liked" || filter === "bookmarked") && req.user?.id) {
        let records: { blogId: string }[] = [];

        if (filter === "liked" && req.user?.id) {
          records = await prisma.like.findMany({
            where: { userId: req.user.id },
            select: { blogId: true },
          });
        } else if (filter === "bookmarked" && req.user?.id) {
          records = await prisma.bookmarks.findMany({
            where: { userId: req.user.id },
            select: { blogId: true },
          });
        }
        const blogIdsFilter = records.map((r) => r.blogId);
        if (blogIdsFilter.length === 0) {
          return res.status(200).json({
            success: true,
            data: [],
            pagination: {
              total: 0,
              page: pageNum,
              limit: limitNum,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          });
        }
        where.id = { in: blogIdsFilter };
      }
      // Get total count
      const totalBlogs = await prisma.blog.count({ where });

      // Fetch blogs
      const blogs = await prisma.blog.findMany({
        where,
        select: {
          id: true,
          title: true,
          excerpt: true,
          featuredImage: true,
          authorId: true,
          tags: true,
          author_image: true,
          createdAt: true,
          views: true,
          readingTime: true,
          author: true,
          _count: { select: { likes: true, comments: true, bookmarks: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      });

      // Fetch user engagement for all returned blogs
      let userLikes: string[] = [];
      let userBookmarks: string[] = [];
      if (req.user?.id) {
        const [likes, bookmarks] = await Promise.all([
          prisma.like.findMany({
            where: {
              userId: req.user.id,
              blogId: { in: blogs.map((b) => b.id) },
            },
            select: { blogId: true },
          }),
          prisma.bookmarks.findMany({
            where: {
              userId: req.user.id,
              blogId: { in: blogs.map((b) => b.id) },
            },
            select: { blogId: true },
          }),
        ]);
        userLikes = likes.map((l) => l.blogId);
        userBookmarks = bookmarks.map((b) => b.blogId);
      }

      // Map response
      const blogResponses = blogs.map((blog) => ({
        id: blog.id,
        title: blog.title,
        excerpt: blog.excerpt,
        featuredImage: blog.featuredImage,
        tags: blog.tags,
        readingTime: blog.readingTime,
        createdAt: blog.createdAt,
        author: {
          id: blog.authorId,
          name: blog.author,
          image: blog.author_image,
        },
        engagement: {
          likes: blog._count.likes,
          comments: blog._count.comments,
          bookmarks: blog._count.bookmarks,
          views: blog.views,
        },
        userEngagement: {
          hasLiked: userLikes.includes(blog.id),
          hasBookmarked: userBookmarks.includes(blog.id),
        },
      }));

      const totalPages = Math.ceil(totalBlogs / limitNum);

      return res.status(200).json({
        success: true,
        data: blogResponses,
        pagination: {
          total: totalBlogs,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      });
    } catch (error) {
      next(error);
    }
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
    const userId = req?.user?.id;

    // check if blog exists
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }

    // check if user already liked
    const existingLike = await prisma.like.findUnique({
      where: { blogId_userId: { blogId: id, userId } },
    });

    if (existingLike) {
      // 👎 user already liked → remove like
      await prisma.like.deleteMany({ where: { blogId: id, userId } });

      return res.status(200).json({
        success: true,
        message: "Blog disliked successfully",
        data: null,
      });
    } else {
      // 👍 first time → create like
      const newLike = await prisma.like.create({
        data: {
          blogId: id,
          userId: userId,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Blog liked successfully",
        data: newLike,
      });
    }
  },

  // ✅ Bookmark blog
  bookmarkBlog: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req?.user?.id;
    const blog = await prisma.blog.findUnique({ where: { id } });

    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }

    const existingBookmark = await prisma.bookmarks.findFirst({
      where: {
        blogId: id,
        userId,
      },
    });

    if (existingBookmark) {
      await prisma.bookmarks.delete({
        where: {
          id: existingBookmark.id,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Blog removed from bookmark successfully",
        data: null,
      });
    } else {
      const bookmarkBlog = await prisma.bookmarks.create({
        data: {
          blogId: id,
          userId: req?.user?.id,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Blog is bookmarked",
        data: bookmarkBlog,
      });
    }
  },

  commentBlog: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { comment: content } = req.body;
    const commentBlog = await prisma.comment.create({
      data: {
        blogId: id,
        userId: req?.user?.id,
        content,
      },
    });

    return res.status(200).json({ success: true, data: commentBlog });
  },

  updateCommentBlog: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.params;
    const { comment: content } = req.body;
    const checkComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!checkComment)
      return res
        .status(404)
        .json({ success: false, message: "comment is not found" });
    const upadtedComment = await prisma.comment.update({
      where: { id },
      data: {
        content,
      },
    });

    return res.status(200).json({ success: true, data: upadtedComment });
  },

  deleteCommentBlog: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.params;
    await prisma.comment.delete({
      where: { id },
    });

    return res.status(200).json({ success: true, data: null });
  },
};
