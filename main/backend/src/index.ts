import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fundraisersRouter from "./routes/fundraisers";
import releaseRouter from "./routes/release";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", releaseRouter)
app.use("/fundraisers", fundraisersRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
// app.listen(port, () => console.log(`MedFund backend on :${port}`));

app.listen(3001, () => console.log("Backend running on :3001"));