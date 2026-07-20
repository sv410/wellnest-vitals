import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory storage (replace with database in production)
const vitalsStore: any[] = [];
let nextId = 1;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'WellNest API is running' });
});

// Get all vitals
app.get('/api/vitals', (req, res) => {
  res.json(vitalsStore);
});

// Get vitals by type
app.get('/api/vitals/:type', (req, res) => {
  const type = req.params.type;
  const filtered = vitalsStore.filter(v => v.type === type);
  res.json(filtered);
});

// Create a new vital entry
app.post('/api/vitals', (req, res) => {
  const newVital = {
    id: (nextId++).toString(),
    ...req.body,
    timestamp: Date.now()
  };
  vitalsStore.push(newVital);
  res.status(201).json(newVital);
});

// Update a vital entry
app.put('/api/vitals/:id', (req, res) => {
  const id = req.params.id;
  const index = vitalsStore.findIndex(v => v.id === id);
  if (index !== -1) {
    vitalsStore[index] = { ...vitalsStore[index], ...req.body };
    res.json(vitalsStore[index]);
  } else {
    res.status(404).json({ error: 'Vital not found' });
  }
});

// Delete a vital entry
app.delete('/api/vitals/:id', (req, res) => {
  const id = req.params.id;
  const index = vitalsStore.findIndex(v => v.id === id);
  if (index !== -1) {
    const deleted = vitalsStore.splice(index, 1);
    res.json(deleted[0]);
  } else {
    res.status(404).json({ error: 'Vital not found' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 WellNest API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
