import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import authRoute from "./routes/auth/auth.route";
import userRoute from "./routes/users/user.route";
import artistRoute from "./routes/artist/artist.route";
import servicesRoute from "./routes/services/services.route";
import commissionsRoute from "./routes/commissions/commissions.route";
import reviewsRoute from "./routes/reviews/reviews.route";
import categoriesRoute from "./routes/categories/categories.route";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
            origin.startsWith("http://localhost") ||
            origin.startsWith("http://127.0.0.1") ||
            origin.startsWith("http://192.168.") ||
            origin.startsWith("http://10.") ||
            origin.startsWith("http://172.")
        ) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options(/(.*)/, cors());
app.use(express.json());

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/artists", artistRoute);
app.use("/api/v1/services", servicesRoute);
app.use("/api/v1/commissions", commissionsRoute);
app.use("/api/v1/reviews", reviewsRoute);
app.use("/api/v1/categories", categoriesRoute);

app.get("/", (_req, res) => {
    res.send("AVen Commission API");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
