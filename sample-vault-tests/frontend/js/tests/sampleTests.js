/**
 * Función para asegurar independencia de los tests de samples
 * y no depender de otro test para tener un token de sesión válido
 */
async function okLogin() {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'pepe', password: '12345' })
    });
    const data = await response.json();
    localStorage.setItem('test_token', data.token);
}

/**
 * Test: GET /api/samples/my-samples
 */
testUtils.createTestButton("Test Listar Mis Samples", async (btn) => {
    await okLogin();
    const token = localStorage.getItem('test_token');

    const response = await fetch('/api/samples/my-samples', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: POST /api/samples/upload (Simulado)
 */
testUtils.createTestButton("Test Subir Sample (Simulado)", async (btn) => {
    await okLogin();
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('display_name', 'Test Loop Pedagogico');
    formData.append('category', 'Drums');
    formData.append('bpm', '120');

    const blob = new Blob(["Simulated Audio Content"], { type: 'audio/wav' });
    formData.append('audioFile', blob, 'DRUM_LOOP_01.wav');

    const response = await fetch('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Ej03 - Test Eliminar Sample Dinámico
 */
testUtils.createTestButton("Test Eliminar Sample Dinámico", async (btn) => {
    await okLogin();
    const token = localStorage.getItem('test_token');

    // 1. Obtener lista de samples del usuario
    const listResponse = await fetch('/api/samples/my-samples', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const listData = await listResponse.json();
    testUtils.log(listData);

    // 2. Validar que haya al menos un sample
    if (!listData.samples || listData.samples.length === 0) {
        testUtils.log({ advertencia: 'No hay samples. Subí uno primero antes de ejecutar este test.' });
        return;
    }

    // 3. Tomar el ID del primer sample
    const targetId = listData.samples[0].id;
    testUtils.log({ intentando_borrar_id: targetId });

    // 4. Ejecutar DELETE
    const deleteResponse = await fetch(`/api/samples/${targetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const deleteData = await deleteResponse.json();
    testUtils.log(deleteData);

    if (deleteResponse.ok) {
        testUtils.setSuccess(btn);
    }
});

/**
 * Ej04 - Test Subir Sample - Error por Datos Faltantes
 */
testUtils.createTestButton("Test Subir Sample - Error por Datos Faltantes", async (btn) => {
    await okLogin();
    const token = localStorage.getItem('test_token');

    // Solo agregamos el archivo, sin category ni display_name
    const blob = new Blob(["Contenido de audio falso"], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audioFile', blob, 'test_incompleto.wav');

    const response = await fetch('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 400) {
        testUtils.setSuccess(btn);
    }
});