// backend/routes/tienda.js
const express    = require('express');
const router     = express.Router();
const tienda     = require('../controllers/tiendaController');
const auth       = require('../middleware/authMiddleware');

// ── RUTAS PÚBLICAS ────────────────────────────────────────────

// GET /api/tienda/productos
router.get('/productos', tienda.getProductos);

// GET /api/tienda/productos/:id
router.get('/productos/:id', tienda.getProductoById);

// ── RUTAS PRIVADAS (cliente logueado) ─────────────────────────

// POST /api/tienda/pedidos
router.post('/pedidos', auth.verificarToken, tienda.crearPedido);

// GET /api/tienda/mis-pedidos
router.get('/mis-pedidos', auth.verificarToken, tienda.getMisPedidos);

// ── RUTAS SOLO ADMIN ──────────────────────────────────────────

// POST /api/tienda/productos
router.post('/productos', auth.verificarToken, auth.soloAdmin, tienda.crearProducto);

// PUT /api/tienda/productos/:id
router.put('/productos/:id', auth.verificarToken, auth.soloAdmin, tienda.editarProducto);

// DELETE /api/tienda/productos/:id
router.delete('/productos/:id', auth.verificarToken, auth.soloAdmin, tienda.eliminarProducto);

// GET /api/tienda/pedidos (todos los pedidos)
router.get('/pedidos', auth.verificarToken, auth.soloAdmin, tienda.getTodosPedidos);

module.exports = router;
