// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

// ── HELPERS DE VALIDACIÓN ─────────────────────────────────────
const emailValido     = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const telefonoValido  = tel   => /^[6789]\d{8}$/.test(tel);

// ── REGISTRO ──────────────────────────────────────────────────
const registro = async (req, res) => {
    let { nombre, apellidos, telefono, email, contraseña } = req.body;

    // Sanitizar espacios
    nombre     = nombre?.trim();
    apellidos  = apellidos?.trim();
    telefono   = telefono?.trim();
    email      = email?.trim().toLowerCase();
    contraseña = contraseña?.trim();

    // Campos obligatorios
    if (!nombre || !apellidos || !email || !contraseña) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Longitud de nombre y apellidos
    if (nombre.length < 2 || nombre.length > 50) {
        return res.status(400).json({ error: 'El nombre debe tener entre 2 y 50 caracteres' });
    }
    if (apellidos.length < 2 || apellidos.length > 100) {
        return res.status(400).json({ error: 'Los apellidos deben tener entre 2 y 100 caracteres' });
    }

    // Formato de email
    if (!emailValido(email)) {
        return res.status(400).json({ error: 'El formato del email no es válido' });
    }

    // Longitud de contraseña
    if (contraseña.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    if (contraseña.length > 100) {
        return res.status(400).json({ error: 'La contraseña es demasiado larga' });
    }

    // Teléfono (opcional, pero si se rellena debe ser válido)
    if (telefono && !telefonoValido(telefono)) {
        return res.status(400).json({ error: 'El teléfono debe ser un número español válido (9 dígitos, comenzando por 6, 7, 8 o 9)' });
    }

    try {
        // Comprobar si el email ya existe
        const [existe] = await pool.query(
            'SELECT id FROM usuarios WHERE email = ?', [email]
        );
        if (existe.length > 0) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        // Encriptar la contraseña
        const hash = await bcrypt.hash(contraseña, 10);

        // Insertar el usuario en la base de datos
        const [resultado] = await pool.query(
            'INSERT INTO usuarios (nombre, apellidos, telefono, email, contraseña) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellidos, telefono || null, email, hash]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            id: resultado.insertId
        });

    } catch (error) {
        console.error('Error en registro:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ── LOGIN ─────────────────────────────────────────────────────
const login = async (req, res) => {
    let { email, contraseña } = req.body;

    email      = email?.trim().toLowerCase();
    contraseña = contraseña?.trim();

    if (!email || !contraseña) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (!emailValido(email)) {
        return res.status(400).json({ error: 'El formato del email no es válido' });
    }

    try {
        // Buscar el usuario por email
        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?', [email]
        );
        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }

        const usuario = usuarios[0];

        // Comparar la contraseña
        const coincide = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!coincide) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            mensaje: 'Login correcto',
            token,
            usuario: {
                id:        usuario.id,
                nombre:    usuario.nombre,
                apellidos: usuario.apellidos,
                email:     usuario.email,
                rol:       usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { registro, login };