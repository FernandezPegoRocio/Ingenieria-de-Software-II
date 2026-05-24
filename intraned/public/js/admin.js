// admin.js

// 1. Verificación estricta de sesión
if (!localStorage.getItem('admin_token')) {
    window.location.href = '/login.html';
}

const app = document.getElementById('app-admin');

// 2. Funciones utilitarias (Deberían ir a un utils.js en el futuro)
function crearElemento(tag, clase = "", texto = "") {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto) el.textContent = texto;
    return el;
}

function crearInput(labelTxt, id, type = 'text') {
    const div = crearElemento('div', 'campo-form');
    const label = crearElemento('label', '', labelTxt);
    const input = crearElemento('input');
    input.id = id;
    input.type = type;
    input.required = true;
    div.append(label, input);
    return div;
}

// 3. Construcción del Layout
const containerPrincipal = crearElemento('div', 'admin-container');
app.appendChild(containerPrincipal);

// --- SECCIÓN A: FORMULARIO DE CARGA ---
const seccionFormulario = crearElemento('section', 'card');
seccionFormulario.append(crearElemento('h2', '', 'Cargar Nuevo Recurso'));

const formUpload = crearElemento('form');
formUpload.append(
    crearInput('Título del Material:', 'titulo'),
    crearInput('Autor/a:', 'autor'),
    crearInput('Tema:', 'tema'),
    crearInput('Archivo (PDF/MP3/IMG):', 'archivo', 'file')
);

const btnSubmit = crearElemento('button', 'btn', 'Subir a la Isla');
btnSubmit.type = 'submit';

const statusMsg = crearElemento('p', 'status-msg');
statusMsg.style.marginTop = '15px';

formUpload.append(btnSubmit, statusMsg);
seccionFormulario.appendChild(formUpload);
containerPrincipal.appendChild(seccionFormulario);

// --- SECCIÓN B: LISTADO DE RECURSOS ---
const seccionRecursos = crearElemento('section', 'card');
seccionRecursos.style.marginTop = '20px';
seccionRecursos.append(crearElemento('h2', '', 'Recursos en el Servidor'));

const listaContenidos = crearElemento('div', 'lista-admin');
seccionRecursos.appendChild(listaContenidos);
containerPrincipal.appendChild(seccionRecursos);


// 4. Lógica de Negocio

// Función para obtener y renderizar los archivos alojados
async function cargarRecursosAdmin() {
    listaContenidos.replaceChildren(); // Limpieza eficiente del DOM
    listaContenidos.appendChild(crearElemento('p', '', 'Cargando recursos...'));

    try {
        const res = await fetch('/api/contenidos');
        if (!res.ok) throw new Error("Respuesta no satisfactoria del servidor");
        
        const data = await res.json();
        listaContenidos.replaceChildren(); // Volver a limpiar tras la carga

        if (!data.contenidos || data.contenidos.length === 0) {
            listaContenidos.appendChild(crearElemento('p', '', 'La base de datos está vacía.'));
            return;
        }

        // Renderizado del listado
        data.contenidos.forEach(item => {
            const fila = crearElemento('div', 'admin-resource-item');
            fila.style.borderBottom = "1px solid #333";
            fila.style.padding = "10px 0";
            fila.style.display = "flex";
            fila.style.justifyContent = "space-between";
            
            const info = crearElemento('span', '', `${item.titulo} - ${item.autor} (${item.tema})`);
            
            const enlace = crearElemento('a', '', 'Abrir');
            enlace.href = `/recursos/${item.file}`;
            enlace.target = "_blank";
            enlace.style.color = "var(--accent)";

            fila.append(info, enlace);
            listaContenidos.appendChild(fila);
        });

    } catch (error) {
        console.error("Error técnico al cargar contenidos:", error);
        listaContenidos.replaceChildren(crearElemento('p', '', 'Error de conexión con la API de contenidos.'));
        listaContenidos.style.color = "#e74c3c";
    }
}

// Evento de subida de archivos
formUpload.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('archivo');
    if (fileInput.files.length === 0) {
        statusMsg.textContent = "Requisito: Seleccione un archivo.";
        statusMsg.style.color = "#e74c3c";
        return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = "Procesando E/S...";
    statusMsg.textContent = "";

    const formData = new FormData();
    formData.append('archivo', fileInput.files[0]);
    formData.append('titulo', document.getElementById('titulo').value);
    formData.append('autor', document.getElementById('autor').value);
    formData.append('tema', document.getElementById('tema').value);

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': localStorage.getItem('admin_token') },
            body: formData
        });

        if (res.ok) {
            statusMsg.textContent = "Escritura en disco y metadata exitosa.";
            statusMsg.style.color = "#2ecc71";
            formUpload.reset(); 
            cargarRecursosAdmin(); // Re-renderiza la lista para mostrar el nuevo archivo
        } else {
            const err = await res.json();
            statusMsg.textContent = `Error del servidor: ${err.error}`;
            statusMsg.style.color = "#e74c3c";
        }
    } catch (error) {
        statusMsg.textContent = "Excepción: Error de red al intentar el POST.";
        statusMsg.style.color = "#e74c3c";
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Subir a la Isla";
    }
});

// 5. Inicialización
cargarRecursosAdmin();