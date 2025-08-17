import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple function to generate random string
function generateId(length = 8) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

// Initialize database
const file = join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// API endpoint to save map configuration
app.post('/api/maps', async (req, res) => {
  await db.read();
  
  const mapConfig = {
    id: generateId(8),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  if (!db.data) {
    db.data = { maps: [] };
  }
  
  db.data.maps.push(mapConfig);
  await db.write();
  
  res.json({ 
    success: true, 
    mapId: mapConfig.id,
    embedCode: `<iframe src="${req.protocol}://${req.get('host')}/embed/${mapConfig.id}" width="${mapConfig.width || '100%'}" height="${mapConfig.height || 500}" style="border:none;"></iframe>`
  });
});

// Route to serve embedded map
app.get('/embed/:id', async (req, res) => {
  await db.read();
  const mapConfig = db.data?.maps.find(m => m.id === req.params.id);
  
  if (!mapConfig) {
    return res.status(404).send('Map not found');
  }
  
  res.render('embed', { mapConfig });
});

// Start server
const init = async () => {
  await db.read();
  if (!db.data) {
    db.data = { maps: [] };
    await db.write();
  }
  
  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
};

init();

export default app;
