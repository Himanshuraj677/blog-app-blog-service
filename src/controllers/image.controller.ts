import { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase.config";
import AppError from "../utils/AppError";

export const imageController = {
    getSignedUrl: async (req: Request, res: Response, next: NextFunction) => {
        const fileName = req.query.filename as string;
        const bucket = req.query.bucket as string;
        if (!fileName) return res.status(400).json({ error: "Filename required" });

        const filePath = `blogs/${Date.now()}-${fileName}`;

        const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(filePath);

        if (error) throw new AppError(error.message, 500);

        res.status(200).json({ uploadUrl: data.signedUrl, filePath });
    }
}