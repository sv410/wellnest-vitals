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

// Add COOP/COEP headers required for Shen.AI SDK WebAssembly multi-threading
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

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

// ── Shen.AI Token Proxy ──────────────────────────────────────────────────────
// Issues a short-lived Shen.AI bearer token using the server-side admin key.
// The SHENAI_ADMIN_KEY is never exposed to the browser.
app.post('/api/shenai/token', async (req, res) => {
  const adminKey = process.env.SHENAI_ADMIN_KEY;

  if (!adminKey) {
    return res.status(401).json({
      error: 'SHENAI_ADMIN_KEY not configured on server. Add it to your .env file.'
    });
  }

  try {
    const body: Record<string, any> = {
      expires_in: req.body.expires_in ?? 3600,
      single_device: req.body.single_device ?? true,
    };

    if (process.env.SHENAI_LICENSE_ID) {
      body.license_id = parseInt(process.env.SHENAI_LICENSE_ID, 10);
    }

    if (req.body.max_measurements != null) {
      body.max_measurements = req.body.max_measurements;
    }

    const response = await fetch('https://api.shen.ai/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Shen.AI API error: ${errText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Shen.AI token generation failed:', error);
    res.status(500).json({ error: error.message ?? 'Unexpected server error' });
  }
});
// ────────────────────────────────────────────────────────────────────────────

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
  console.log(`🤖 Shen.AI token endpoint: ${process.env.SHENAI_ADMIN_KEY ? '✅ Configured' : '⚠️  Not configured (simulator mode)'}`);
});
