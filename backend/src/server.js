import app from './app.js';
import { env } from './config/env.js';
import './config/firebase.js';

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`Mate-Mático API → http://localhost:${PORT}/api`);
  console.log(`CORS permitidos  → ${env.corsOrigins.join(', ')}`);
});
