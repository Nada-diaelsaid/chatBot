import express from "express";
import cors from "cors";
import chatRouter from "./routers/chat.route.ts";
import customerRouter from "./routers/customer.route.ts";
import orderRouter from "./routers/order.route.ts";
import weatherRouter from "./routers/weather.route.ts";
import mcpServerRouter from "./routers/mcp_server.route.ts";

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', chatRouter);
app.use('/api', customerRouter);
app.use('/api', orderRouter);
app.use('/api', weatherRouter);

// Mount MCP server router on /mcp route
app.use('/mcp', mcpServerRouter);

const PORT: number = Number(process.env.PORT) || 3000;

app.get("/", (req, res) => {
    res.send("Hello Agentic App Backend");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});