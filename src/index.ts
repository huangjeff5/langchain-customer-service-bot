import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import { customerServiceFlow } from './customerServiceChains';

config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/customer-service', async (req, res) => {
  try {
    const result = await customerServiceFlow(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
