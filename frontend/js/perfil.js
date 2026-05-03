// frontend/js/perfil.js

const API     = 'http://localhost:3000/api';
const token   = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

// ── COMPROBAR LOGIN ──────────────────────────────────────────
if (!token || !usuario) {
    alert('Debes iniciar sesión para acceder a tu perfil.');
    window.location.href = 'login.html';
}

// ── MOSTRAR DATOS DEL USUARIO ────────────────────────────────
document.getElementById('perfilNombre').textContent = `${usuario.nombre} ${usuario.apellidos || ''}`.trim();
document.getElementById('perfilEmail').textContent  = usuario.email;

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

// ── CARGAR CITAS ─────────────────────────────────────────────
async function cargarCitas() {
    try {
        const res   = await fetch(`${API}/citas/mis-citas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const citas = await res.json();
        const lista = document.getElementById('listaCitas');

        if (!citas.length) {
            lista.innerHTML = `
                <div class="vacio">
                    <span class="vacio-icon">✂️</span>
                    <h3>No tienes citas</h3>
                    <p>Reserva tu primera cita ahora</p>
                </div>`;
            return;
        }

        lista.innerHTML = citas.map(c => {
            // La fecha viene en UTC, cogemos solo los primeros 10 caracteres
            const fechaBruta = c.fecha ? c.fecha.substring(0, 10) : null;
            const fecha      = fechaBruta ? new Date(fechaBruta + 'T12:00:00') : null;
            const fechaStr   = fecha ? fecha.toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            }) : 'Fecha no disponible';

            // Campos correctos según la API
            const nombre    = c.servicio || c.servicio_nombre || 'Servicio';
            const precio    = c.precio_cobrado ? parseFloat(c.precio_cobrado).toFixed(2) : '–';
            const horaIni   = c.hora_inicio ? c.hora_inicio.substring(0, 5) : '–';
            const horaFin   = c.hora_fin    ? c.hora_fin.substring(0, 5)    : '–';
            const puedeCanc = c.estado === 'pendiente' || c.estado === 'confirmada';

            return `
                <div class="cita-card">
                    <div>
                        <p class="cita-servicio">${nombre}</p>
                        <p class="cita-detalle">📅 ${fechaStr}</p>
                        <p class="cita-detalle">🕐 ${horaIni} – ${horaFin}</p>
                        <p class="cita-detalle">💰 ${precio}€</p>
                        <span class="cita-estado estado-${c.estado}">${c.estado}</span>
                    </div>
                    ${puedeCanc ? `<button class="btn-cancelar" onclick="cancelarCita(${c.id})">Cancelar</button>` : ''}
                </div>
            `;
        }).join('');

    } catch (e) {
        document.getElementById('listaCitas').innerHTML =
            '<div class="loading">Error al cargar las citas.</div>';
    }
}

// ── CANCELAR CITA ────────────────────────────────────────────
async function cancelarCita(id) {
    if (!confirm('¿Seguro que quieres cancelar esta cita?')) return;

    try {
        const res = await fetch(`${API}/citas/cancelar/${id}`, {
            method:  'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            cargarCitas();
        } else {
            const data = await res.json();
            alert(data.error || 'No se pudo cancelar la cita.');
        }
    } catch (e) {
        alert('Error al conectar con el servidor.');
    }
}

// ── CARGAR PEDIDOS ───────────────────────────────────────────
async function cargarPedidos() {
    try {
        const res     = await fetch(`${API}/tienda/mis-pedidos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pedidos = await res.json();
        const lista   = document.getElementById('listaPedidos');

        if (!pedidos.length) {
            lista.innerHTML = `
                <div class="vacio">
                    <span class="vacio-icon">📦</span>
                    <h3>No tienes pedidos</h3>
                    <p>Explora nuestra tienda de productos</p>
                </div>`;
            return;
        }

        lista.innerHTML = pedidos.map(p => {
            const fecha = new Date(p.fecha_pedido).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long', year: 'numeric'
            });

            const lineas = p.lineas ? p.lineas.map(l => `
                <div class="pedido-linea">
                    <span>${l.producto_nombre} × ${l.cantidad}</span>
                    <span>${(l.precio_unitario * l.cantidad).toFixed(2)}€</span>
                </div>
            `).join('') : '';

            return `
                <div class="pedido-card">
                    <div class="pedido-header">
                        <span class="pedido-id">Pedido #${p.id}</span>
                        <span class="pedido-fecha">${fecha}</span>
                        <span class="pedido-total">${parseFloat(p.total).toFixed(2)}€</span>
                    </div>
                    <div class="pedido-lineas">${lineas}</div>
                </div>
            `;
        }).join('');

    } catch (e) {
        document.getElementById('listaPedidos').innerHTML =
            '<div class="loading">Error al cargar los pedidos.</div>';
    }
}

// ── INICIAR ──────────────────────────────────────────────────
cargarCitas();
cargarPedidos();