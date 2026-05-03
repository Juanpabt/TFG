// backend/controllers/citasController.js
const pool = require('../config/db');

// ── SERVICIOS ─────────────────────────────────────────────────

// GET todos los servicios activos
const getServicios = async (req, res) => {
    try {
        const [servicios] = await pool.query(
            'SELECT * FROM servicios WHERE activo = 1'
        );
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
};

// ── CITAS ─────────────────────────────────────────────────────

// GET horarios ocupados de un día concreto
const getHorariosOcupados = async (req, res) => {
    const { fecha } = req.params;
    try {
        const [citas] = await pool.query(
            `SELECT hora_inicio, hora_fin FROM citas
             WHERE fecha = ? AND estado NOT IN ('cancelada')`,
            [fecha]
        );
        res.json(citas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener horarios' });
    }
};

// POST reservar una cita
const crearCita = async (req, res) => {
    const { servicio_id, fecha, hora_inicio } = req.body;

    if (!servicio_id || !fecha || !hora_inicio) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        // Obtener duración y precio del servicio
        const [servicios] = await pool.query(
            'SELECT * FROM servicios WHERE id = ? AND activo = 1',
            [servicio_id]
        );
        if (servicios.length === 0) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        const servicio = servicios[0];

        // Calcular hora_fin sumando la duración en minutos
        const [horas, minutos] = hora_inicio.split(':').map(Number);
        const totalMinutos = horas * 60 + minutos + servicio.duracion;
        const horaFin = `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;

        // Comprobar que no hay otra cita en ese horario
        const [conflicto] = await pool.query(
            `SELECT id FROM citas
             WHERE fecha = ? AND estado NOT IN ('cancelada')
             AND (
                 (hora_inicio < ? AND hora_fin > ?) OR
                 (hora_inicio < ? AND hora_fin > ?) OR
                 (hora_inicio >= ? AND hora_fin <= ?)
             )`,
            [fecha, horaFin, hora_inicio, horaFin, hora_inicio, hora_inicio, horaFin]
        );

        if (conflicto.length > 0) {
            return res.status(409).json({ error: 'Ese horario ya está ocupado' });
        }

        // Insertar la cita
        const [resultado] = await pool.query(
            `INSERT INTO citas (usuario_id, servicio_id, fecha, hora_inicio, hora_fin, precio_cobrado)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.usuario.id, servicio_id, fecha, hora_inicio, horaFin, servicio.precio]
        );

        res.status(201).json({
            mensaje: 'Cita reservada correctamente',
            id: resultado.insertId,
            hora_fin: horaFin
        });

    } catch (error) {
        console.error('Error al crear cita:', error.message);
        res.status(500).json({ error: 'Error al crear la cita' });
    }
};

// GET mis citas
const getMisCitas = async (req, res) => {
    try {
        const [citas] = await pool.query(
            `SELECT c.id, c.fecha, c.hora_inicio, c.hora_fin, c.precio_cobrado, c.estado,
                    s.nombre AS servicio, s.duracion
             FROM citas c
             JOIN servicios s ON s.id = c.servicio_id
             WHERE c.usuario_id = ?
             ORDER BY c.fecha DESC, c.hora_inicio DESC`,
            [req.usuario.id]
        );
        res.json(citas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener citas' });
    }
};

// PUT cancelar mi cita
const cancelarCita = async (req, res) => {
    try {
        const [resultado] = await pool.query(
            `UPDATE citas SET estado = 'cancelada'
             WHERE id = ? AND usuario_id = ? AND estado = 'pendiente'`,
            [req.params.id, req.usuario.id]
        );
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada o no se puede cancelar' });
        }
        res.json({ mensaje: 'Cita cancelada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al cancelar la cita' });
    }
};

// ── ADMIN ─────────────────────────────────────────────────────

// GET todas las citas (admin)
const getTodasCitas = async (req, res) => {
    try {
        const [citas] = await pool.query(
            `SELECT c.id, c.fecha, c.hora_inicio, c.hora_fin, c.precio_cobrado, c.estado,
                    s.nombre AS servicio,
                    u.nombre, u.apellidos, u.telefono, u.email
             FROM citas c
             JOIN servicios s ON s.id = c.servicio_id
             JOIN usuarios u  ON u.id = c.usuario_id
             ORDER BY c.fecha ASC, c.hora_inicio ASC`
        );
        res.json(citas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener citas' });
    }
};

// PUT cambiar estado de una cita (admin)
const cambiarEstadoCita = async (req, res) => {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'confirmada', 'cancelada', 'completada'];

    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: 'Estado no válido' });
    }

    try {
        const [resultado] = await pool.query(
            'UPDATE citas SET estado = ? WHERE id = ?',
            [estado, req.params.id]
        );
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        res.json({ mensaje: 'Estado de la cita actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la cita' });
    }
};

module.exports = {
    getServicios,
    getHorariosOcupados,
    crearCita,
    getMisCitas,
    cancelarCita,
    getTodasCitas,
    cambiarEstadoCita
};