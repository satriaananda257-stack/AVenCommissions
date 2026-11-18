import { Response } from "express";
import { AuthRequest } from "../../config/middleware/auth.middleware";
import { updateProfileSchema, userParamSchema } from "../../validations/profile.validation";
import { db } from "../../config/db";
import { usersTable, artistProfilesTable, favoritesTable } from "../../config/schema";
import { and, eq } from "drizzle-orm";
import { uploadToCloudinary } from "../../services/cloudinary.services";

export class UsersController {
    getMyProfile = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const user = await this._buildProfile(userId);
            if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan" });
            return res.json({ success: true, message: "Profile retrieved", data: { user } });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    getUserProfile = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = userParamSchema.parse(req.params);
            const user = await this._buildProfile(id);
            if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan" });
            return res.json({ success: true, message: "Profile retrieved", data: { user } });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    updateMyProfile = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const validated = updateProfileSchema.parse(req.body);

            let profilePicture: string | undefined;
            if (req.file) {
                const result = await uploadToCloudinary(req.file.buffer);
                profilePicture = result.secure_url;
            }

            await db.update(usersTable).set({
                ...(validated.username && { username: validated.username }),
                ...(profilePicture && { profilePicture }),
            }).where(eq(usersTable.id, userId));

            const user = await this._buildProfile(userId);
            return res.json({ success: true, message: "Profile updated", data: { user } });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    getMyFavorites = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const favorites = await db
                .select({
                    artistId: usersTable.id,
                    username: usersTable.username,
                    profilePicture: usersTable.profilePicture,
                    bio: artistProfilesTable.bio,
                    portfolioUrl: artistProfilesTable.portfolioUrl,
                    isAvailable: artistProfilesTable.isAvailable,
                })
                .from(favoritesTable)
                .innerJoin(usersTable, eq(favoritesTable.artistId, usersTable.id))
                .leftJoin(artistProfilesTable, eq(favoritesTable.artistId, artistProfilesTable.userId))
                .where(eq(favoritesTable.customerId, userId));
            return res.json({ success: true, message: "Favorites retrieved", data: { favorites } });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    addFavorite = async (req: AuthRequest, res: Response) => {
        try {
            const { id: artistId } = userParamSchema.parse(req.params);
            const customerId = req.user!.id;
            if (customerId === artistId) return res.status(400).json({ success: false, message: "Tidak bisa favorite diri sendiri" });
            const existing = await db.select().from(favoritesTable).where(and(eq(favoritesTable.customerId, customerId), eq(favoritesTable.artistId, artistId)));
            if (existing.length > 0) return res.status(409).json({ success: false, message: "Artist sudah ada di favorites" });
            await db.insert(favoritesTable).values({ customerId, artistId });
            return res.status(201).json({ success: true, message: "Artist added to favorites" });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    removeFavorite = async (req: AuthRequest, res: Response) => {
        try {
            const { id: artistId } = userParamSchema.parse(req.params);
            const customerId = req.user!.id;
            await db.delete(favoritesTable).where(and(eq(favoritesTable.customerId, customerId), eq(favoritesTable.artistId, artistId)));
            return res.json({ success: true, message: "Artist removed from favorites" });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    private _buildProfile = async (userId: number) => {
        const [user] = await db
            .select({
                id: usersTable.id,
                username: usersTable.username,
                email: usersTable.email,
                role: usersTable.role,
                profilePicture: usersTable.profilePicture,
                createdAt: usersTable.createdAt,
            })
            .from(usersTable)
            .where(eq(usersTable.id, userId));
        if (!user) return null;
        if (user.role === "artist") {
            const artistProfile = await db.query.artistProfilesTable.findFirst({ where: eq(artistProfilesTable.userId, userId) });
            return { ...user, artistProfile: artistProfile ?? null };
        }
        return user;
    };
}

export default new UsersController();
