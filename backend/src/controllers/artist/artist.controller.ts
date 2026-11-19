import { Response } from "express";
import { AuthRequest } from "../../config/middleware/auth.middleware";
import { db } from "../../config/db";
import { artistProfilesTable, usersTable } from "../../config/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateArtistProfileSchema = z.object({
    bio: z.string().max(1000).optional(),
    portfolioUrl: z.string().url("URL tidak valid").optional(),
    isAvailable: z.boolean().optional(),
});

export class ArtistController {
    // GET MY ARTIST PROFILE
    getMyArtistProfile = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;

            const profile = await db.query.artistProfilesTable.findFirst({
                where: eq(artistProfilesTable.userId, userId),
            });

            if (!profile) {
                return res.status(404).json({ success: false, message: "Artist profile tidak ditemukan" });
            }

            return res.json({ success: true, message: "Artist profile retrieved", data: { profile } });
        } catch (error) {
            console.error("Get artist profile error:", error);
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    // UPDATE MY ARTIST PROFILE
    updateMyArtistProfile = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const validated = updateArtistProfileSchema.parse(req.body);

            const existing = await db.query.artistProfilesTable.findFirst({
                where: eq(artistProfilesTable.userId, userId),
            });

            if (existing) {
                await db.update(artistProfilesTable).set({
                    ...(validated.bio !== undefined && { bio: validated.bio }),
                    ...(validated.portfolioUrl !== undefined && { portfolioUrl: validated.portfolioUrl }),
                    ...(validated.isAvailable !== undefined && { isAvailable: validated.isAvailable }),
                }).where(eq(artistProfilesTable.userId, userId));
            } else {
                await db.insert(artistProfilesTable).values({
                    userId,
                    bio: validated.bio,
                    portfolioUrl: validated.portfolioUrl,
                    isAvailable: validated.isAvailable ?? true,
                });
            }

            const profile = await db.query.artistProfilesTable.findFirst({
                where: eq(artistProfilesTable.userId, userId),
            });

            return res.json({ success: true, message: "Artist profile updated", data: { profile } });
        } catch (error) {
            console.error("Update artist profile error:", error);
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    // GET ALL ARTISTS (public)
    getAllArtists = async (req: AuthRequest, res: Response) => {
        try {
            const artists = await db
                .select({
                    id: usersTable.id,
                    username: usersTable.username,
                    profilePicture: usersTable.profilePicture,
                    bio: artistProfilesTable.bio,
                    portfolioUrl: artistProfilesTable.portfolioUrl,
                    isAvailable: artistProfilesTable.isAvailable,
                })
                .from(artistProfilesTable)
                .innerJoin(usersTable, eq(artistProfilesTable.userId, usersTable.id));

            return res.json({ success: true, message: "Artists retrieved", data: { artists } });
        } catch (error) {
            console.error("Get all artists error:", error);
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    // GET ARTIST BY ID (public)
    getArtistById = async (req: AuthRequest, res: Response) => {
        try {
            const id = z.coerce.number().int().positive().parse(req.params.id);

            const [artist] = await db
                .select({
                    id: usersTable.id,
                    username: usersTable.username,
                    profilePicture: usersTable.profilePicture,
                    bio: artistProfilesTable.bio,
                    portfolioUrl: artistProfilesTable.portfolioUrl,
                    isAvailable: artistProfilesTable.isAvailable,
                })
                .from(artistProfilesTable)
                .innerJoin(usersTable, eq(artistProfilesTable.userId, usersTable.id))
                .where(eq(artistProfilesTable.userId, id));

            if (!artist) return res.status(404).json({ success: false, message: "Artist tidak ditemukan" });

            return res.json({ success: true, message: "Artist retrieved", data: { artist } });
        } catch (error) {
            console.error("Get artist by id error:", error);
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };
}

export default new ArtistController();
