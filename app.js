let personaCount = 0;

// NAVEGACIÓN
function mostrarSubmenu() {
    ocultarTodo();
    document.getElementById('submenu-mantenimiento').style.display = 'block';
    window.scrollTo(0,0);
}

function mostrarFormulario(tipo) {
    ocultarTodo();
    if(tipo === 'inspeccion') {
        document.getElementById('form-inspeccion-container').style.display = 'block';
        document.getElementById('id-insp').value = "INSP-" + Math.floor(Math.random()*9999);
    } else if(tipo === 'poda') {
        document.getElementById('form-poda-container').style.display = 'block';
        if(personaCount === 0) agregarPersona();
    }
    window.scrollTo(0,0);
}

function volverAlDashboard() {
    ocultarTodo();
    document.getElementById('dashboard').style.display = 'block';
    window.scrollTo(0,0);
}

function ocultarTodo() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('submenu-mantenimiento').style.display = 'none';
    document.getElementById('form-inspeccion-container').style.display = 'none';
    document.getElementById('form-poda-container').style.display = 'none';
}

// LÓGICA DE PERSONAS
function agregarPersona() {
    personaCount++;
    const lista = document.getElementById('lista-personal');
    const div = document.createElement('div');
    div.className = 'persona-row';
    div.innerHTML = `
        <input type="text" placeholder="Nombre" id="p-nom-${personaCount}">
        <div class="grid-2">
            <input type="text" placeholder="Identidad" id="p-id-${personaCount}">
            <input type="number" placeholder="Pago L." id="p-pago-${personaCount}">
        </div>
    `;
    lista.appendChild(div);
}

// GENERACIÓN DE PDF (Estructura base)
function generarPDFPoda() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Aquí el bot llenará la plantilla con los logos y datos
    const zona = document.getElementById('zona-poda').value;

    doc.setFontSize(16);
    doc.text("INFORME DE PODA COMUNITARIA", 10, 20);
    doc.setFontSize(12);
    doc.text("Zona: " + zona, 10, 30);
    doc.text("Generado por: Ing. Josué Ortiz", 10, 40);

    alert("El PDF se ha generado. En la siguiente fase conectaremos las fotos y el logo UTCD.");
    doc.save("Informe_Poda.pdf");
}
