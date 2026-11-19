import { Router, RequestHandler } from "express";
import usersController from "../../controllers/users/user.controller";
import { authenticate } from "../../config/middleware/auth.middleware";
import { uploadSingleImage } from "../../config/middleware/upload.middleware";

const router = Router();

router.get("/me", authenticate, usersController.getMyProfile as RequestHandler);
router.patch("/me", authenticate, uploadSingleImage, usersController.updateMyProfile as RequestHandler);
router.get("/me/favorites", authenticate, usersController.getMyFavorites as RequestHandler);
router.get("/:id", usersController.getUserProfile as RequestHandler);
router.post("/:id/favorite", authenticate, usersController.addFavorite as RequestHandler);
router.delete("/:id/favorite", authenticate, usersController.removeFavorite as RequestHandler);

export default router;
