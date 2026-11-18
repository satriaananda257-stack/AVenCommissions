import {
    mysqlTable,
    mysqlEnum,
    int,
    varchar,
    text,
    timestamp,
    boolean,
    decimal,
    uniqueIndex,
} from "drizzle-orm/mysql-core";

export const USER_ROLES = ["customer", "artist", "admin"] as const;
export const COMMISSION_STATUS = ["pending", "in_progress", "revision", "completed", "cancelled"] as const;
export const FILE_TYPES = ["reference", "result"] as const;

// ─── USERS ────────────────────────────────────────────────────
export const usersTable = mysqlTable("users", {
    id: int("id").autoincrement().primaryKey(),
    username: varchar("username", { length: 100 }).notNull().unique(),
    email: varchar("email", { length: 100 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: mysqlEnum("role", USER_ROLES).notNull().default("customer"),
    profilePicture: text("profile_picture"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── ARTIST PROFILES ──────────────────────────────────────────
export const artistProfilesTable = mysqlTable("artist_profiles", {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
    bio: text("bio"),
    portfolioUrl: varchar("portfolio_url", { length: 255 }),
    isAvailable: boolean("is_available").notNull().default(true),
});

// ─── CATEGORIES ───────────────────────────────────────────────
export const categoriesTable = mysqlTable("categories", {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
});

// ─── SERVICES ─────────────────────────────────────────────────
export const servicesTable = mysqlTable("services", {
    id: int("id").autoincrement().primaryKey(),
    artistId: int("artist_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    categoryId: int("category_id").notNull().references(() => categoriesTable.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    estimatedDays: int("estimated_days").notNull(),
    thumbnail: text("thumbnail"),
});

// ─── COMMISSIONS ──────────────────────────────────────────────
export const commissionsTable = mysqlTable("commissions", {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    artistId: int("artist_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    serviceId: int("service_id").notNull().references(() => servicesTable.id, { onDelete: "restrict" }),
    description: text("description").notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    status: mysqlEnum("status", COMMISSION_STATUS).notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── COMMISSION FILES ─────────────────────────────────────────
export const commissionFilesTable = mysqlTable("commission_files", {
    id: int("id").autoincrement().primaryKey(),
    commissionId: int("commission_id").notNull().references(() => commissionsTable.id, { onDelete: "cascade" }),
    fileUrl: text("file_url").notNull(),
    fileType: mysqlEnum("file_type", FILE_TYPES).notNull(),
});

// ─── REVIEWS ──────────────────────────────────────────────────
export const reviewsTable = mysqlTable("reviews", {
    id: int("id").autoincrement().primaryKey(),
    commissionId: int("commission_id").notNull().unique().references(() => commissionsTable.id, { onDelete: "cascade" }),
    customerId: int("customer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    artistId: int("artist_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    rating: int("rating").notNull(),
    comment: text("comment"),
});

// ─── FAVORITES ────────────────────────────────────────────────
export const favoritesTable = mysqlTable("favorites", {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    artistId: int("artist_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
}, (table) => ({
    uniqueFavorite: uniqueIndex("unique_favorite").on(table.customerId, table.artistId),
}));
