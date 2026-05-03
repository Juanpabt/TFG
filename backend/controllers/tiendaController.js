// backend/controllers/tiendaController.js
const pool = require('../config/db');

// ── PRODUCTOS ─────────────────────────────────────────────────

// GET todos los productos activos
const getProductos = async (req, res) => {
    try {
        const [productos] = await pool.query(
            'SELECT * FROM productos WHERE activo = 1'
        );
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
};

// GET un producto por id
const getProductoById = async (req, res) => {
    try {
        const [productos] = await pool.query(
            'SELECT * FROM productos WHERE id = ? AND activo = 1',
            [req.params.id]
        );
        if (productos.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(productos[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
};

// POST crear producto (solo admin)
const crearProducto = async (req, res) => {
    const { nombre, descripcion, precio, stock, imagen_url } = req.body;

    if (!nombre || !precio) {
        return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
    }

    try {
        const [resultado] = await pool.query(
            'INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url) VALUES (?, ?, ?, ?, ?)',
            [nombre, descripcion || null, precio, stock || 0, imagen_url || null]
        );
        res.status(201).json({ mensaje: 'Producto creado correctamente', id: resultado.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el producto' });
    }
};

// PUT editar producto (solo admin)
const editarProducto = async (req, res) => {
    const { nombre, descripcion, precio, stock, imagen_url, activo } = req.body;

    try {
        const [resultado] = await pool.query(
            'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen_url = ?, activo = ? WHERE id = ?',
            [nombre, descripcion, precio, stock, imagen_url, activo ?? 1, req.params.id]
        );
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al editar el producto' });
    }
};

// DELETE eliminar producto (solo admin)
const eliminarProducto = async (req, res) => {
    try {
        // Borrado lógico: marcamos como inactivo
        const [resultado] = await pool.query(
            'UPDATE productos SET activo = 0 WHERE id = ?',
            [req.params.id]
        );
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
};

// ── PEDIDOS ───────────────────────────────────────────────────

// POST crear pedido
const crearPedido = async (req, res) => {
    const { productos } = req.body;
    // productos = [{ id: 1, cantidad: 2 }, { id: 3, cantidad: 1 }]

    if (!productos || productos.length === 0) {
        return res.status(400).json({ error: 'El pedido debe tener al menos un producto' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        let total = 0;

        // Verificar stock y calcular total
        for (const item of productos) {
            const [rows] = await conn.query(
                'SELECT precio, stock FROM productos WHERE id = ? AND activo = 1',
                [item.id]
            );
            if (rows.length === 0) {
                await conn.rollback();
                return res.status(404).json({ error: `Producto ${item.id} no encontrado` });
            }
            if (rows[0].stock < item.cantidad) {
                await conn.rollback();
                return res.status(400).json({ error: `Stock insuficiente para el producto ${item.id}` });
            }
            total += rows[0].precio * item.cantidad;
        }

        // Crear el pedido
        const [pedido] = await conn.query(
            'INSERT INTO pedidos (usuario_id, total) VALUES (?, ?)',
            [req.usuario.id, total.toFixed(2)]
        );

        // Insertar líneas del pedido y actualizar stock
        for (const item of productos) {
            const [rows] = await conn.query(
                'SELECT precio FROM productos WHERE id = ?', [item.id]
            );
            await conn.query(
                'INSERT INTO pedidos_linea (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [pedido.insertId, item.id, item.cantidad, rows[0].precio]
            );
            await conn.query(
                'UPDATE productos SET stock = stock - ? WHERE id = ?',
                [item.cantidad, item.id]
            );
        }

        await conn.commit();
        res.status(201).json({ mensaje: 'Pedido creado correctamente', id: pedido.insertId, total: total.toFixed(2) });

    } catch (error) {
        await conn.rollback();
        console.error('Error al crear pedido:', error.message);
        res.status(500).json({ error: 'Error al crear el pedido' });
    } finally {
        conn.release();
    }
};

// GET mis pedidos
const getMisPedidos = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.id, p.total, p.estado, p.fecha_creacion,
                    pl.cantidad, pl.precio_unitario,
                    pr.nombre AS producto_nombre
             FROM pedidos p
             JOIN pedidos_linea pl ON pl.pedido_id = p.id
             JOIN productos pr     ON pr.id = pl.producto_id
             WHERE p.usuario_id = ?
             ORDER BY p.fecha_creacion DESC`,
            [req.usuario.id]
        );

        // Agrupar líneas por pedido
        const pedidosMap = {};
        for (const row of rows) {
            if (!pedidosMap[row.id]) {
                pedidosMap[row.id] = {
                    id: row.id,
                    total: row.total,
                    estado: row.estado,
                    fecha_pedido: row.fecha_creacion,
                    lineas: []
                };
            }
            pedidosMap[row.id].lineas.push({
                producto_nombre: row.producto_nombre,
                cantidad: row.cantidad,
                precio_unitario: row.precio_unitario
            });
        }

        res.json(Object.values(pedidosMap));
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
};

// GET todos los pedidos (solo admin)
const getTodosPedidos = async (req, res) => {
    try {
        const [pedidos] = await pool.query(
            `SELECT p.id, p.total, p.estado, p.fecha_creacion,
                    u.nombre, u.apellidos, u.email
             FROM pedidos p
             JOIN usuarios u ON u.id = p.usuario_id
             ORDER BY p.fecha_creacion DESC`
        );
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
};

module.exports = {
    getProductos,
    getProductoById,
    crearProducto,
    editarProducto,
    eliminarProducto,
    crearPedido,
    getMisPedidos,
    getTodosPedidos
};
