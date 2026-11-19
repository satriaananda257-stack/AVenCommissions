import { Response } from "express";
import { AuthRequest } from "../../config/middleware/auth.middleware";
import { db } from "../../config/db";
import { servicesTable, categoriesTable, usersTable } from "../../config/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { uploadToCloudinary, deleteFromCloudinary } from "../../services/cloudinary.services";

const createServiceSchema = z.object({
    categoryId: z.coerce.number().int().positive(),
    title: z.string().min(3).max(255),
    description: z.string().min(1),
    price: z.coerce.number().positive(),
    estimatedDays: z.coerce.number().int().positive(),
});

const updateServiceSchema = createServiceSchema.partial();
const serviceIdSchema = z.object({ id: z.coerce.number().int().positive() });

export class ServicesController {
    // GET ALL SERVICES (public)
    getAllServices = async (req: AuthRequest, res: Response) => {
        try {
            const services = await db
                .select({
                    id: servicesTable.id,
                    title: servicesTable.title,
                    description: servicesTable.description,
                    price: servicesTable.price,
                    estimatedDays: servicesTable.estimatedDays,
                    thumbnail: servicesTable.thumbnail,
                    artistId: servicesTable.artistId,
                    artistUsername: usersTable.username,
                    categoryId: categoriesTable.id,
                    categoryName: categoriesTable.name,
                })
                .from(servicesTable)
                .innerJoin(usersTable, eq(servicesTable.artistId, usersTable.id))
                .innerJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id));

            return res.json({ success: true, message: "Services retrieved", data: { services } });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    // GET SERVICE BY ID (public)
    getServiceById = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = serviceIdSchema.parse(req.params);

            const [service] = await db
                .select({
                    id: servicesTable.id,
                    title: servicesTable.title,
                    description: servicesTable.description,
                    price: servicesTable.price,
                    estimatedDays: servicesTable.estimatedDays,
                    thumbnail: servicesTable.thumbnail,
                    artistId: servicesTable.artistId,
                    artistUsername: usersTable.username,
                    categoryId: categoriesTable.id,
                    categoryName: categoriesTable.name,
                })
                .from(servicesTable)
                .innerJoin(usersTable, eq(servicesTable.artistId, usersTable.id))
                .innerJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
                .where(eq(servicesTable.id, id));

            if (!service) return res.status(404).json({ success: false, message: "Service tidak ditemukan" });

            return res.json({ success: true, message: "Service retrieved", data: { service } });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    // CREATE SERVICE (artist only)
    createService = async (req: AuthRequest, res: Response) => {
        try {
            const artistId = req.user!.id;
            const validated = createServiceSchema.parse(req.body);

            let thumbnail: string | undefined;
            if (req.file) {
                const result = await uploadToCloudinary(req.file.buffer);
                thumbnail = result.secure_url;
            }

            const [inserted] = await db
                .insert(servicesTable)
                .values({ ...validated, price: String(validated.price), artistId, thumbnail })
                .$returningId();

            const service = await db.query.servicesTable.findFirst({
                where: eq(servicesTable.id, inserted.id),
            });

            return res.status(201).json({ success: true, message: "Service created", data: { service } });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    // UPDATE SERVICE (owner only)
    updateService = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = serviceIdSchema.parse(req.params);
            const artistId = req.user!.id;
            const validated = updateServiceSchema.parse(req.body);

            const existing = await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, id) });
            if (!existing) return res.status(404).json({ success: false, message: "Service tidak ditemukan" });
            if (existing.artistId !== artistId) return res.status(403).json({ success: false, message: "Forbidden" });

            let thumbnail = existing.thumbnail;
            if (req.file) {
                const result = await uploadToCloudinary(req.file.buffer);
                thumbnail = result.secure_url;
                if (existing.thumbnail) await deleteFromCloudinary(existing.thumbnail);
            }

            const { price: rawPrice, ...rest } = validated;
            await db.update(servicesTable).set({
                ...rest,
                ...(rawPrice !== undefined && { price: String(rawPrice) }),
                thumbnail,
            }).where(eq(servicesTable.id, id));

            const updated = await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, id) });
            return res.json({ success: true, message: "Service updated", data: { service: updated } });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };

    // DELETE SERVICE (owner only)
    deleteService = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = serviceIdSchema.parse(req.params);
            const artistId = req.user!.id;

            const existing = await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, id) });
            if (!existing) return res.status(404).json({ success: false, message: "Service tidak ditemukan" });
            if (existing.artistId !== artistId) return res.status(403).json({ success: false, message: "Forbidden" });

            await db.delete(servicesTable).where(eq(servicesTable.id, id));
            return res.json({ success: true, message: "Service deleted" });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    };
}

export default new ServicesController();
