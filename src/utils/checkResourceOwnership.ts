import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";

export const checkResourceOwnership =  {
    blog : async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const blog = await prisma.blog.findUnique({
            where: { id },
            select: {
            authorId: true,
            },
        });
        return blog?.authorId || "";
    },
    comment: async ( req: Request, res: Response, next: NextFunction ) => {
        const { id } = req.params;
        const blog = await prisma.comment.findUnique({
            where: { id },
            select: {
            userId: true,
            },
        });
        return blog?.userId || "";
    }
}