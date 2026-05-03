// frontend/js/carrito.js

const API = 'http://localhost:3000/api';

// Imágenes de productos (orden por id)
const imagenesProductos = {
    1: '../img/cera (60ml).jpg',
    2: '../img/after shave 400ml.jpg',
    3: '../img/desinfectante 5 en 1 400ml.png',
    4: '../img/polvos volumen 20g.jpg'
};

// ── GESTIÓN DEL CARRITO EN LOCALSTORAGE ──────────────────────
function getCarrito() {
    return JSON.parse(localStorage.getItem('carrito') || '[]');
}

function setCarrito(carrito) {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function añadirAlCarrito(producto) {
    const carrito = getCarrito();
    const existe  = carrito.find(p => p.id === producto.id);
    if (existe) {
        existe.cantidad += 1;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    setCarrito(carrito);
    actualizarContadorNav();
}

function actualizarContadorNav() {
    const carrito = getCarrito();
    const total   = carrito.reduce((acc, p) => acc + p.cantidad, 0);
    const contador = document.getElementById('carritoContador');
    if (contador) {
        contador.textContent = total;
        contador.style.display = total > 0 ? 'flex' : 'none';
    }
}

// ── RENDERIZAR CARRITO ───────────────────────────────────────
function renderCarrito() {
    const carrito      = getCarrito();
    const carritoItems = document.getElementById('carritoItems');
    const carritoVacio = document.getElementById('carritoVacio');
    const layout       = document.querySelector('.carrito-layout');

    if (!carritoItems) return;

    if (carrito.length === 0) {
        layout.style.display       = 'none';
        carritoVacio.classList.remove('hidden');
        return;
    }

    layout.style.display = 'grid';
    carritoVacio.classList.add('hidden');

    carritoItems.innerHTML = carrito.map(item => `
        <div class="carrito-item" id="item-${item.id}">
            <div class="item-img">
                ${imagenesProductos[item.id]
                    ? `<img src="${imagenesProductos[item.id]}" alt="${item.nombre}">`
                    : `<span class="item-emoji">🧴</span>`
                }
            </div>
            <div class="item-info">
                <h3 class="item-nombre">${item.nombre}</h3>
                <p class="item-precio-unit">${parseFloat(item.precio).toFixed(2)}€ por unidad</p>
                <div class="item-cantidad">
                    <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, -1)">−</button>
                    <div class="cantidad-num">${item.cantidad}</div>
                    <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, 1)">+</button>
                </div>
            </div>
            <div class="item-acciones">
                <span class="item-subtotal">${(parseFloat(item.precio) * item.cantidad).toFixed(2)}€</span>
                <button class="btn-eliminar" onclick="eliminarItem(${item.id})">✕ Eliminar</button>
            </div>
        </div>
    `).join('');

    actualizarResumen();
}

// ── CAMBIAR CANTIDAD ─────────────────────────────────────────
function cambiarCantidad(id, delta) {
    const carrito = getCarrito();
    const item    = carrito.find(p => p.id === id);
    if (!item) return;

    item.cantidad += delta;

    if (item.cantidad <= 0) {
        eliminarItem(id);
        return;
    }

    setCarrito(carrito);
    renderCarrito();
    actualizarContadorNav();
}

// ── ELIMINAR ITEM ────────────────────────────────────────────
function eliminarItem(id) {
    const carrito = getCarrito().filter(p => p.id !== id);
    setCarrito(carrito);
    renderCarrito();
    actualizarContadorNav();
}

// ── ACTUALIZAR RESUMEN ───────────────────────────────────────
function actualizarResumen() {
    const carrito  = getCarrito();
    const cantidad = carrito.reduce((acc, p) => acc + p.cantidad, 0);
    const subtotal = carrito.reduce((acc, p) => acc + parseFloat(p.precio) * p.cantidad, 0);

    document.getElementById('resumenCantidad').textContent  = cantidad;
    document.getElementById('resumenSubtotal').textContent  = subtotal.toFixed(2) + '€';
    document.getElementById('resumenTotal').textContent     = subtotal.toFixed(2) + '€';
}

// ── FINALIZAR COMPRA ─────────────────────────────────────────
document.getElementById('btnComprar').addEventListener('click', async () => {
    const token    = localStorage.getItem('token');
    const errorMsg   = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');

    errorMsg.style.display   = 'none';
    successMsg.style.display = 'none';

    if (!token) {
        errorMsg.textContent   = 'Debes iniciar sesión para finalizar la compra.';
        errorMsg.style.display = 'block';
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const carrito = getCarrito();
    if (carrito.length === 0) return;

    const productos = carrito.map(p => ({ id: p.id, cantidad: p.cantidad }));

    try {
        const res = await fetch(`${API}/tienda/pedidos`, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productos })
        });

        const data = await res.json();

        if (!res.ok) {
            errorMsg.textContent   = data.error || 'Error al procesar el pedido.';
            errorMsg.style.display = 'block';
            return;
        }

        // Limpiar carrito
        setCarrito([]);
        actualizarContadorNav();

        successMsg.textContent   = `✅ ¡Pedido realizado! Total: ${data.total}€. Redirigiendo...`;
        successMsg.style.display = 'block';

        document.getElementById('btnComprar').disabled = true;

        setTimeout(() => window.location.href = 'index.html', 2500);

    } catch (e) {
        errorMsg.textContent   = 'No se pudo conectar con el servidor.';
        errorMsg.style.display = 'block';
    }
});

// ── INICIAR ──────────────────────────────────────────────────
renderCarrito();
actualizarContadorNav();