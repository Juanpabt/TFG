// frontend/js/main.js

// ── LOADER ──
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 800);
        }
    }, 1500);
});

// ── CURSOR PERSONALIZADO ──
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');

if (cursor && cursorRing) {
    document.addEventListener('mousemove', e => {
        cursor.style.left     = e.clientX - 6  + 'px';
        cursor.style.top      = e.clientY - 6  + 'px';
        cursorRing.style.left = e.clientX - 18 + 'px';
        cursorRing.style.top  = e.clientY - 18 + 'px';
    });

    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform     = 'scale(2)';
            cursorRing.style.transform = 'scale(1.5)';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.transform     = 'scale(1)';
            cursorRing.style.transform = 'scale(1)';
        });
    });
}

// ── NAVBAR AL HACER SCROLL ──
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    if (window.scrollY > 80) {
        nav.style.background   = 'rgba(10,10,10,0.97)';
        nav.style.borderBottom = '1px solid rgba(201,168,76,0.2)';
    } else {
        nav.style.background   = 'linear-gradient(to bottom, rgba(0,0,0,0.95), transparent)';
        nav.style.borderBottom = '1px solid rgba(201,168,76,0.1)';
    }
});

// ── CARRITO ──
function añadirCarrito(id, nombre, precio) {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    const existe  = carrito.find(p => p.id === id);
    if (existe) {
        existe.cantidad += 1;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1 });
    }
    localStorage.setItem('carrito', JSON.stringify(carrito));
    alert('✅ ' + nombre + ' añadido al carrito');
}

// ── ACTUALIZAR NAVBAR SEGÚN LOGIN ──
const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || 'null');
if (usuarioGuardado) {
    const btnEntrar = document.querySelector('a[href="login.html"]');
    if (btnEntrar) {
        btnEntrar.textContent = '👤 ' + usuarioGuardado.nombre;
        btnEntrar.href = 'perfil.html';
    }
}