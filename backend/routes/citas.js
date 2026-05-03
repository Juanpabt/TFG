// backend/routes/citas.js
const express = require('express');
const router  = express.Router();
const citas   = require('../controllers/citasController');
const auth    = require('../middleware/authMiddleware');

// ── RUTAS PÚBLICAS ────────────────────────────────────────────

// GET /api/citas/servicios
router.get('/servicios', citas.getServicios);

// GET /api/citas/horarios-ocupados/:fecha
router.get('/horarios-ocupados/:fecha', citas.getHorariosOcupados);

// ── RUTAS PRIVADAS (cliente logueado) ─────────────────────────

// POST /api/citas
router.post('/', auth.verificarToken, citas.crearCita);

// GET /api/citas/mis-citas
router.get('/mis-citas', auth.verificarToken, citas.getMisCitas);

// PUT /api/citas/cancelar/:id
router.put('/cancelar/:id', auth.verificarToken, citas.cancelarCita);

// ── RUTAS SOLO ADMIN ──────────────────────────────────────────

// GET /api/citas
router.get('/', auth.verificarToken, auth.soloAdmin, citas.getTodasCitas);

// PUT /api/citas/:id/estado
router.put('/:id/estado', auth.verificarToken, auth.soloAdmin, citas.cambiarEstadoCita);

module.exports = router;