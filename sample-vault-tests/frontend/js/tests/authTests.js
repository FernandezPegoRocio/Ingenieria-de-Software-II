/**
 * Test: POST /api/auth/login
 */
testUtils.createTestButton("Test Login Correcto (Pepe y 12345)", async (btn) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'pepe', password: '12345' })
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 200) {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("Test Login - Password Incorrecto (Pepe y 123)", async (btn) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'pepe', password: '123' })
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 401) {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("Test Login - Usuario Incorrecto (Juan y 12345)", async (btn) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'juan', password: '12345' })
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 401) {
        testUtils.setSuccess(btn);
    }
});

/**
 * Ej01 - Test Registro de Usuario Nuevo
 */
testUtils.createTestButton("Test Registro - Usuario Nuevo", async (btn) => {
    const nuevoUsuario = `user_${Date.now()}`;
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: nuevoUsuario, password: 'password123' })
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 201) {
        testUtils.setSuccess(btn);
    }
});

/**
 * Ej02 - Test Seguridad: Productor accediendo a ruta de Admin
 */
testUtils.createTestButton("Test Seguridad - Productor accediendo a Admin", async (btn) => {
    await okLogin();
    const token = localStorage.getItem('test_token');

    const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 403) {
        testUtils.setSuccess(btn);
    }
});