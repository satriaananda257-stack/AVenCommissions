import { Router, RequestHandler } from "express";
import artistController from "../../controllers/artist/artist.controller";
import { authenticate } from "../../config/middleware/auth.middleware";

const router = Router();

// GET all artists (public)
router.get("/", artistController.getAllArtists as RequestHandler);

// GET my artist profile (must be before /:id)
router.get("/me/profile", authenticate, artistController.getMyArtistProfile as RequestHandler);

// UPDATE my artist profile
router.patch("/me/profile", authenticate, artistController.updateMyArtistProfile as RequestHandler);

// GET artist by id (public)
router.get("/:id", artistController.getArtistById as RequestHandler);

export default router;
