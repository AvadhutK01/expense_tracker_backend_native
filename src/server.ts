import express, { Request, Response } from 'express';
import categoriesRouter from './routes/categoriesRoute.js';
import dotenv from "dotenv";
import connectToDatabase from './utils/dbConnection.js';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
}));

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express + TypeScript 🎉');
});

app.post('/echo', (req: Request, res: Response) => {
  res.json({ youSent: req.body });
});

app.use('/categories', categoriesRouter);

connectToDatabase().then(() => {
  app.listen(9000, () => {
    console.log(`🚀 Server is running`);
  });
}).catch((err) => {
  console.log("Database connection failed:", err);
  process.exit(1);
});

export default app;
