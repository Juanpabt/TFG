// frontend/js/admin.js

const API     = 'http://localhost:3000/api';
const token   = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

// ── COMPROBAR LOGIN Y ROL ADMIN ──────────────────────────────
if (!token || !usuario || usuario.rol !== 'admin') {
    alert('Acceso restringido. Solo administradores.');
    window.location.href = 'index.html';
}

// ── CERRAR SESIÓN ────────────────────────────────────────────
document.getElementById('btnCerrar').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
});

// ── CAMBIAR TAB ──────────────────────────────────────────────
function cambiarTab(tab, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    el.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
}

// ── CARGAR STATS ─────────────────────────────────────────────
async function cargarStats() {
    try {
        const [resCitas, resPedidos, resProductos] = await Promise.all([
            fetch(`${API}/citas`,           { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API}/tienda/pedidos`,  { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API}/tienda/productos`)
        ]);

        const citas     = await resCitas.json();
        const pedidos   = await resPedidos.json();
        const productos = await resProductos.json();

        document.getElementById('statCitas').textContent     = Array.isArray(citas)     ? citas.length     : '–';
        document.getElementById('statPedidos').textContent   = Array.isArray(pedidos)   ? pedidos.length   : '–';
        document.getElementById('statProductos').textContent = Array.isArray(productos) ? productos.length : '–';
    } catch (e) {
        console.error('Error cargando stats:', e);
    }
}

// ── CARGAR CITAS ─────────────────────────────────────────────
async function cargarCitas() {
    const lista  = document.getElementById('listaCitas');
    const filtro = document.getElementById('filtroCitas').value;

    lista.innerHTML = '<div class="loading">Cargando...</div>';

    try {
        const res  = await fetch(`${API}/citas`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        let citas = await res.json();

        if (filtro) citas = citas.filter(c => c.estado === filtro);

        if (!citas.length) {
            lista.innerHTML = '<div class="loading">No hay citas.</div>';
            return;
        }

        lista.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Cliente</th>
                        <th>Servicio</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Precio</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${citas.map(c => {
                        const fecha    = c.fecha ? c.fecha.substring(0,10) : '–';
                        const hora     = c.hora_inicio ? c.hora_inicio.substring(0,5) : '–';
                        const precio   = c.precio_cobrado ? parseFloat(c.precio_cobrado).toFixed(2) : '–';
                        const cliente  = c.nombre && c.apellidos ? `${c.nombre} ${c.apellidos}` : c.nombre || c.cliente_nombre || '–';
                        const servicio = c.servicio || c.servicio_nombre || '–';

                        return `
                            <tr>
                                <td>${c.id}</td>
                                <td>${cliente}</td>
                                <td>${servicio}</td>
                                <td>${fecha}</td>
                                <td>${hora}</td>
                                <td>${precio}€</td>
                                <td>
                                    <select class="select-estado" onchange="cambiarEstadoCita(${c.id}, this.value)">
                                        <option value="pendiente"  ${c.estado==='pendiente'  ? 'selected':''}>Pendiente</option>
                                        <option value="confirmada" ${c.estado==='confirmada' ? 'selected':''}>Confirmada</option>
                                        <option value="completada" ${c.estado==='completada' ? 'selected':''}>Completada</option>
                                        <option value="cancelada"  ${c.estado==='cancelada'  ? 'selected':''}>Cancelada</option>
                                    </select>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        lista.innerHTML = '<div class="loading">Error al cargar las citas.</div>';
    }
}

// ── CAMBIAR ESTADO CITA ──────────────────────────────────────
async function cambiarEstadoCita(id, estado) {
    try {
        await fetch(`${API}/citas/${id}/estado`, {
            method:  'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization:  `Bearer ${token}`
            },
            body: JSON.stringify({ estado })
        });
    } catch (e) {
        alert('Error al cambiar el estado.');
    }
}

// ── CARGAR PEDIDOS ───────────────────────────────────────────
async function cargarPedidos() {
    const lista = document.getElementById('listaPedidos');
    lista.innerHTML = '<div class="loading">Cargando...</div>';

    try {
        const res     = await fetch(`${API}/tienda/pedidos`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const pedidos = await res.json();

        if (!pedidos.length) {
            lista.innerHTML = '<div class="loading">No hay pedidos.</div>';
            return;
        }

        lista.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.map(p => {
                        const fecha   = p.fecha_creacion ? new Date(p.fecha_creacion).toLocaleDateString('es-ES') : '–';
                        const cliente = p.nombre && p.apellidos ? `${p.nombre} ${p.apellidos}` : p.nombre || '–';

                        return `
                            <tr>
                                <td>${p.id}</td>
                                <td>${cliente}</td>
                                <td>${fecha}</td>
                                <td>${parseFloat(p.total).toFixed(2)}€</td>
                                <td><span class="estado estado-${p.estado || 'pendiente'}">${p.estado || 'pendiente'}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        lista.innerHTML = '<div class="loading">Error al cargar los pedidos.</div>';
    }
}

// ── CARGAR PRODUCTOS ─────────────────────────────────────────
async function cargarProductos() {
    const lista = document.getElementById('listaProductos');
    lista.innerHTML = '<div class="loading">Cargando...</div>';

    try {
        const res       = await fetch(`${API}/tienda/productos`);
        const productos = await res.json();

        if (!productos.length) {
            lista.innerHTML = '<div class="loading">No hay productos.</div>';
            return;
        }

        lista.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.nombre}</td>
                            <td>${parseFloat(p.precio).toFixed(2)}€</td>
                            <td>${p.stock ?? '–'}</td>
                            <td>
                                <button class="btn-editar" onclick="abrirModalProducto(${p.id}, '${p.nombre}', '${(p.descripcion || '').replace(/'/g,"\\'")}', ${p.precio}, ${p.stock ?? 0})">Editar</button>
                                <button class="btn-borrar" onclick="borrarProducto(${p.id})">Borrar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        lista.innerHTML = '<div class="loading">Error al cargar los productos.</div>';
    }
}

// ── MODAL PRODUCTO ───────────────────────────────────────────
let productoEditandoId = null;

function abrirModalProducto(id, nombre, desc, precio, stock) {
    productoEditandoId = id || null;
    document.getElementById('modalTitle').textContent      = id ? 'Editar Producto' : 'Nuevo Producto';
    document.getElementById('prodNombre').value            = nombre || '';
    document.getElementById('prodDesc').value              = desc   || '';
    document.getElementById('prodPrecio').value            = precio || '';
    document.getElementById('prodStock').value             = stock  || '';
    document.getElementById('modalError').style.display   = 'none';
    document.getElementById('modalSuccess').style.display = 'none';
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
    productoEditandoId = null;
}

async function guardarProducto() {
    const nombre = document.getElementById('prodNombre').value.trim();
    const desc   = document.getElementById('prodDesc').value.trim();
    const precio = parseFloat(document.getElementById('prodPrecio').value);
    const stock  = parseInt(document.getElementById('prodStock').value);
    const errEl  = document.getElementById('modalError');
    const sucEl  = document.getElementById('modalSuccess');

    errEl.style.display = 'none';
    sucEl.style.display = 'none';

    if (!nombre || !precio) {
        errEl.textContent   = 'Nombre y precio son obligatorios.';
        errEl.style.display = 'block';
        return;
    }

    const url    = productoEditandoId ? `${API}/tienda/productos/${productoEditandoId}` : `${API}/tienda/productos`;
    const method = productoEditandoId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization:  `Bearer ${token}`
            },
            body: JSON.stringify({ nombre, descripcion: desc, precio, stock })
        });

        if (res.ok) {
            sucEl.textContent   = productoEditandoId ? '✅ Producto actualizado.' : '✅ Producto creado.';
            sucEl.style.display = 'block';
            setTimeout(() => { cerrarModal(); cargarProductos(); cargarStats(); }, 1000);
        } else {
            const data = await res.json();
            errEl.textContent   = data.error || 'Error al guardar.';
            errEl.style.display = 'block';
        }
    } catch (e) {
        errEl.textContent   = 'Error al conectar con el servidor.';
        errEl.style.display = 'block';
    }
}

// ── BORRAR PRODUCTO ──────────────────────────────────────────
async function borrarProducto(id) {
    if (!confirm('¿Seguro que quieres borrar este producto?')) return;

    try {
        const res = await fetch(`${API}/tienda/productos/${id}`, {
            method:  'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            cargarProductos();
            cargarStats();
        } else {
            alert('No se pudo borrar el producto.');
        }
    } catch (e) {
        alert('Error al conectar con el servidor.');
    }
}

// ── CERRAR MODAL AL HACER CLIC FUERA ────────────────────────
document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) cerrarModal();
});

// ── INICIAR ──────────────────────────────────────────────────
cargarStats();
cargarCitas();
cargarPedidos();
cargarProductos();