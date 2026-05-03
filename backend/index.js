// backend/index.js
const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');

// Cargar variables de entorno
dotenv.config();

// Importar conexión a la base de datos
const pool = require('./config/db');

// Importar rutas
const authRoutes   = require('./routes/auth');
const citasRoutes  = require('./routes/citas');
const tiendaRoutes = require('./routes/tienda');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ──────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/citas',  citasRoutes);
app.use('/api/tienda', tiendaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: '✅ Servidor de Barbería funcionando correctamente' });
});

// ── Arrancar servidor ─────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});