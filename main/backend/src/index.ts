import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fundraisersRouter from "./routes/fundraisers";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/fundraisers", fundraisersRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`MedFund backend on :${port}`));