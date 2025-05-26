import express, { Request, Response } from 'express';
import categoriesRouter from './routes/categoriesRoute.js';
import dotenv from "dotenv";
import connectToDatabase from './utils/dbConnection.js';
import { scheduleMonthlyRecurringUpdate } from './utils/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express + TypeScript 🎉');
});

app.post('/echo', (req: Request, res: Response) => {
  res.json({ youSent: req.body });
});

app.use('/categories', categoriesRouter);

connectToDatabase().then(() => {
  scheduleMonthlyRecurringUpdate();
  app.listen(PORT, () => {
    console.log(`⚡️ Server running ${PORT}`);
  });
}).catch((err) => {
  console.log(err);
  process.exit(1)
})
