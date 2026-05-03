// frontend/js/registro.js

const emailValido    = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const telefonoValido = tel   => /^[6789]\d{8}$/.test(tel);
const soloLetras     = texto => /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]+$/.test(texto);

document.getElementById('btnRegistro').addEventListener('click', async () => {
    const nombre     = document.getElementById('nombre').value.trim();
    const apellidos  = document.getElementById('apellidos').value.trim();
    const telefono   = document.getElementById('telefono').value.trim();
    const email      = document.getElementById('email').value.trim().toLowerCase();
    const contraseña = document.getElementById('password').value;
    const password2  = document.getElementById('password2').value;
    const errorMsg   = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');

    errorMsg.style.display   = 'none';
    successMsg.style.display = 'none';

    const mostrarError = msg => {
        errorMsg.textContent   = msg;
        errorMsg.style.display = 'block';
    };

    // Campos obligatorios
    if (!nombre || !apellidos || !email || !contraseña) {
        return mostrarError('Rellena todos los campos obligatorios.');
    }

    // Validar nombre y apellidos (solo letras)
    if (!soloLetras(nombre)) {
        return mostrarError('El nombre no puede contener números ni caracteres especiales.');
    }
    if (nombre.length < 2 || nombre.length > 50) {
        return mostrarError('El nombre debe tener entre 2 y 50 caracteres.');
    }

    if (!soloLetras(apellidos)) {
        return mostrarError('Los apellidos no pueden contener números ni caracteres especiales.');
    }
    if (apellidos.length < 2 || apellidos.length > 100) {
        return mostrarError('Los apellidos deben tener entre 2 y 100 caracteres.');
    }

    // Validar email
    if (!emailValido(email)) {
        return mostrarError('El formato del email no es válido.');
    }

    // Validar teléfono (opcional)
    if (telefono && !telefonoValido(telefono)) {
        return mostrarError('El teléfono debe ser un número español válido (9 dígitos, empezando por 6, 7, 8 o 9).');
    }

    // Validar contraseña
    if (contraseña.length < 8) {
        return mostrarError('La contraseña debe tener al menos 8 caracteres.');
    }
    if (!/[A-Z]/.test(contraseña)) {
        return mostrarError('La contraseña debe tener al menos una letra mayúscula.');
    }
    if (!/[0-9]/.test(contraseña)) {
        return mostrarError('La contraseña debe tener al menos un número.');
    }

    if (contraseña !== password2) {
        return mostrarError('Las contraseñas no coinciden.');
    }

    try {
        const res = await fetch('http://localhost:3000/api/auth/registro', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ nombre, apellidos, telefono, email, contraseña })
        });

        const data = await res.json();

        if (!res.ok) {
            return mostrarError(data.error || 'Error al registrarse.');
        }

        successMsg.textContent   = '✅ Cuenta creada correctamente. Redirigiendo al login...';
        successMsg.style.display = 'block';

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);

    } catch (error) {
        mostrarError('No se pudo conectar con el servidor.');
    }
});