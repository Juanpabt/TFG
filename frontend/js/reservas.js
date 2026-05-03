// frontend/js/reservas.js

const API    = 'http://localhost:3000/api';
const iconos  = ['✂️', '🪒', '💈', '🔥'];
const imagenes = [
    '../img/tapper fade.jpg',
    '../img/barba1.jpg',
    '../img/corte y barba.jpg',
    '../img/Buzz cut.jpg'
];

let servicioSeleccionado = null;
let fechaSeleccionada    = null;
let horaSeleccionada     = null;

// ── COMPROBAR LOGIN ──────────────────────────────────────────
const token   = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

if (!token || !usuario) {
    alert('Debes iniciar sesión para reservar una cita.');
    window.location.href = 'login.html';
}

// ── CARGAR SERVICIOS ─────────────────────────────────────────
async function cargarServicios() {
    try {
        const res       = await fetch(`${API}/citas/servicios`);
        const servicios = await res.json();
        const grid      = document.getElementById('serviciosGrid');

        grid.innerHTML = servicios.map((s, i) => `
            <div class="servicio-card" onclick="seleccionarServicio(${s.id}, '${s.nombre}', ${s.precio}, ${s.duracion}, this)">
                <img src="${imagenes[i] || ''}" alt="${s.nombre}" class="servicio-img">
                <h3 class="servicio-nombre">${s.nombre}</h3>
                <p class="servicio-duracion">${s.duracion} min</p>
                <span class="servicio-precio">${s.precio}€</span>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error al cargar servicios:', e);
    }
}

// ── SELECCIONAR SERVICIO ─────────────────────────────────────
function seleccionarServicio(id, nombre, precio, duracion, el) {
    document.querySelectorAll('.servicio-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    servicioSeleccionado = { id, nombre, precio, duracion };
    setTimeout(() => irAPaso(2), 400);
}

// ── GENERAR HORAS DISPONIBLES ────────────────────────────────
async function generarHoras(fecha) {
    const horasGrid = document.getElementById('horasGrid');
    horasGrid.innerHTML = '<p style="color:rgba(201,168,76,0.4);font-size:0.8rem;">Cargando horarios...</p>';

    const horasTodas = [];
    for (let h = 9; h < 20; h++) {
        horasTodas.push(`${String(h).padStart(2,'0')}:00`);
        if (h < 19) horasTodas.push(`${String(h).padStart(2,'0')}:30`);
    }

    try {
        const res      = await fetch(`${API}/citas/horarios-ocupados/${fecha}`);
        const ocupados = await res.json();
        const ahora    = new Date();

        horasGrid.innerHTML = horasTodas.map(hora => {
            const [hh, mm] = hora.split(':').map(Number);
            const horaDate = new Date(fecha);
            horaDate.setHours(hh, mm, 0, 0);

            const esPasada    = horaDate <= ahora;
            const estaOcupada = ocupados.some(o => {
                const inicio = o.hora_inicio.substring(0,5);
                const fin    = o.hora_fin.substring(0,5);
                return hora >= inicio && hora < fin;
            });

            const disabled = esPasada || estaOcupada ? 'disabled' : '';
            const titulo   = esPasada ? 'Hora pasada' : estaOcupada ? 'Ocupado' : '';

            return `<button class="hora-btn" ${disabled} title="${titulo}"
                onclick="seleccionarHora('${hora}', this)">${hora}</button>`;
        }).join('');

    } catch (e) {
        horasGrid.innerHTML = '<p style="color:#ff8080;font-size:0.8rem;">Error al cargar horarios.</p>';
    }
}

// ── SELECCIONAR HORA ─────────────────────────────────────────
function seleccionarHora(hora, el) {
    document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    horaSeleccionada = hora;
    document.getElementById('btnNext2').disabled = false;
}

// ── CAMBIO DE FECHA ──────────────────────────────────────────
document.getElementById('fechaCita').addEventListener('change', (e) => {
    fechaSeleccionada = e.target.value;
    horaSeleccionada  = null;
    document.getElementById('btnNext2').disabled = true;
    generarHoras(fechaSeleccionada);
});

// ── NAVEGACIÓN ENTRE PASOS ───────────────────────────────────
function irAPaso(paso) {
    document.querySelectorAll('.step-content').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.step').forEach((s, i) => {
        s.classList.remove('active', 'done');
        if (i + 1 < paso)  s.classList.add('done');
        if (i + 1 === paso) s.classList.add('active');
    });
    document.getElementById(`step${paso}`).classList.remove('hidden');
    if (paso === 3) rellenarResumen();
}

document.getElementById('btnBack1').addEventListener('click', () => irAPaso(1));
document.getElementById('btnBack2').addEventListener('click', () => irAPaso(2));
document.getElementById('btnNext2').addEventListener('click', () => {
    if (!fechaSeleccionada || !horaSeleccionada) return;
    irAPaso(3);
});

// ── RELLENAR RESUMEN ─────────────────────────────────────────
function rellenarResumen() {
    const fecha    = new Date(fechaSeleccionada + 'T00:00:00');
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    document.getElementById('resumenServicio').textContent = servicioSeleccionado.nombre;
    document.getElementById('resumenFecha').textContent    = fecha.toLocaleDateString('es-ES', opciones);
    document.getElementById('resumenHora').textContent     = horaSeleccionada;
    document.getElementById('resumenDuracion').textContent = `${servicioSeleccionado.duracion} min`;
    document.getElementById('resumenPrecio').textContent   = `${servicioSeleccionado.precio}€`;
}

// ── CONFIRMAR CITA ───────────────────────────────────────────
document.getElementById('btnConfirmar').addEventListener('click', async () => {
    const errorMsg   = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');

    errorMsg.style.display   = 'none';
    successMsg.style.display = 'none';

    try {
        const res = await fetch(`${API}/citas`, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                servicio_id: servicioSeleccionado.id,
                fecha:       fechaSeleccionada,
                hora_inicio: horaSeleccionada
            })
        });

        const data = await res.json();

        if (!res.ok) {
            errorMsg.textContent   = data.error || 'Error al reservar la cita.';
            errorMsg.style.display = 'block';
            return;
        }

        successMsg.textContent   = '✅ ¡Cita reservada correctamente! Redirigiendo...';
        successMsg.style.display = 'block';
        document.getElementById('btnConfirmar').disabled = true;

        setTimeout(() => window.location.href = 'index.html', 2000);

    } catch (e) {
        errorMsg.textContent   = 'No se pudo conectar con el servidor.';
        errorMsg.style.display = 'block';
    }
});

// ── FECHA MÍNIMA (hoy) ───────────────────────────────────────
const hoy = new Date().toISOString().split('T')[0];
document.getElementById('fechaCita').min = hoy;

// ── INICIAR ──────────────────────────────────────────────────
cargarServicios();