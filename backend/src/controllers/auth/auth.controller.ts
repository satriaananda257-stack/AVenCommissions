import { Request, Response } from "express";
import { registerSchema, loginSchema } from "../../validations/auth.validation";
import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { usersTable } from "../../config/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthController {
    register = async (req: Request, res: Response) => {
        try {
            const { username, email, password } = registerSchema.parse(req.body);

            const existingEmail = await db.query.usersTable.findFirst({
                where: eq(usersTable.email, email),
            });
            if (existingEmail) {
                return res.status(409).json({ success: false, message: "Email sudah digunakan" });
            }

            const existingUsername = await db.query.usersTable.findFirst({
                where: eq(usersTable.username, username),
            });
            if (existingUsername) {
                return res.status(409).json({ success: false, message: "Username sudah digunakan" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const [insertedUser] = await db
                .insert(usersTable)
                .values({ username, email, password: hashedPassword })
                .$returningId();

            return res.status(201).json({
                success: true,
                message: "Register berhasil",
                data: {
                    user: {
                        id: insertedUser.id,
                        username,
                        email,
                    },
                },
            });
        } catch (error) {
            console.error("Register error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = loginSchema.parse(req.body);

            const user = await db.query.usersTable.findFirst({
                where: eq(usersTable.email, email),
            });
            if (!user) {
                return res.status(404).json({ success: false, message: "Email atau password salah" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: "Email atau password salah" });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET as string,
                { expiresIn: "7d" }
            );

            return res.status(200).json({
                success: true,
                message: "Login berhasil",
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        profilePicture: user.profilePicture,
                    },
                },
            });
        } catch (error) {
            console.error("Login error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : error,
            });
        }
    };
}

export default new AuthController();
