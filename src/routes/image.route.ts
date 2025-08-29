import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { imageController } from "../controllers/image.controller.js";
const router = Router();

router.get('/get-upload-url', asyncHandler(imageController.getSignedUrl));

export default router;