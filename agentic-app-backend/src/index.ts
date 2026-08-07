import express from "express";
import cors from "cors";
import chatRouter from "./routers/chatRouter.ts";

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', chatRouter);

const PORT: number = Number(process.env.PORT) || 3000;

app.get("/", (req, res) => {
    res.send("Hello Agentic App Backend");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});