import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import { customerService } from './sequences/customerService';

config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/customer-service', async (req, res) => {
  try {
    const result = await customerService.invoke(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
