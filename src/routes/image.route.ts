import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { imageController } from "../controllers/image.controller";
const router = Router();

router.get('/get-upload-url', asyncHandler(imageController.getSignedUrl));

export default router;