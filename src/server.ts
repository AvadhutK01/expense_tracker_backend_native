// server.ts
import express, { Request, Response } from 'express';
import categoriesRouter from './routes/categoriesRoute.js';
import dotenv from "dotenv";
import connectToDatabase from './utils/dbConnection.js';
import { scheduleMonthlyRecurringUpdate } from './utils/scheduler.js';

dotenv.config();

const app = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express + TypeScript 🎉');
});

app.post('/echo', (req: Request, res: Response) => {
  res.json({ youSent: req.body });
});

app.use('/categories', categoriesRouter);

// Connect to DB and run any scheduled jobs (do this once)
connectToDatabase().then(() => {
  scheduleMonthlyRecurringUpdate();
  app.listen(9000, () => {
    console.log(`🚀 Server is running at http://localhost:${9000}`);
  });
}).catch((err) => {
  console.log("Database connection failed:", err);
  process.exit(1);
});

export default app;
