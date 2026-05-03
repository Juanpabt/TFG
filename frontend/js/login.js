// frontend/js/login.js

document.getElementById('btnLogin').addEventListener('click', async () => {
    const email      = document.getElementById('email').value.trim();
    const contraseña = document.getElementById('password').value;
    const errorMsg   = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');

    errorMsg.style.display   = 'none';
    successMsg.style.display = 'none';

    if (!email || !contraseña) {
        errorMsg.textContent   = 'Por favor rellena todos los campos.';
        errorMsg.style.display = 'block';
        return;
    }

    try {
        const res  = await fetch('http://localhost:3000/api/auth/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, contraseña })
        });

        const data = await res.json();

        if (!res.ok) {
            errorMsg.textContent   = data.error || 'Email o contraseña incorrectos.';
            errorMsg.style.display = 'block';
            return;
        }

        // Guardar token y datos del usuario en localStorage
        localStorage.setItem('token',   data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));

        successMsg.textContent   = '✅ Acceso correcto. Entrando...';
        successMsg.style.display = 'block';

        // Redirigir según el rol
        setTimeout(() => {
            if (data.usuario.rol === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 1000);

    } catch (error) {
        errorMsg.textContent   = 'No se pudo conectar con el servidor.';
        errorMsg.style.display = 'block';
    }
});

// Login con tecla Enter
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btnLogin').click();
});