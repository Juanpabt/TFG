// backend/routes/auth.js
const express    = require('express');
const router     = express.Router();
const authController    = require('../controllers/authController');
const authMiddleware    = require('../middleware/authMiddleware');
const pool       = require('../config/db');

// POST /api/auth/registro
router.post('/registro', authController.registro);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/perfil
router.get('/perfil', authMiddleware.verificarToken, async (req, res) => {
    try {
        const [usuarios] = await pool.query(
            'SELECT id, nombre, apellidos, telefono, email, rol, fecha_creacion FROM usuarios WHERE id = ?',
            [req.usuario.id]
        );
        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuarios[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;