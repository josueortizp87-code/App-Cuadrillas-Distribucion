var mapI, mapP, markerI, markerP;
var gpsIni = "No marcado", gpsFin = "No marcado";

// --- NAVEGACIÓN (Se mantiene igual) ---
function mostrarSubmenu() {
    ocultarTodo();
    document.getElementById('submenu-mantenimiento').style.display = 'block';
    window.scrollTo(0,0);
}

function mostrarFormulario(tipo) {
    ocultarTodo();
    if(tipo === 'inspeccion') {
        document.getElementById('form-inspeccion-container').style.display = 'block';
        document.getElementById('id-insp').value = "INSP-" + Math.floor(Math.random()*999999);
        initMapInsp();
    } else if(tipo === 'poda') {
        document.getElementById('form-poda-container').style.display = 'block';
        initMapPoda();
    }
    window.scrollTo(0,0);
}

function volverAlDashboard() {
    ocultarTodo();
    document.getElementById('dashboard').style.display = 'block';
    window.scrollTo(0,0);
}

function ocultarTodo() {
    const ids = ['dashboard', 'submenu-mantenimiento', 'form-inspeccion-container', 'form-poda-container'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
}

// --- MAPAS ---
function initMapInsp() {
    if (!mapI) {
        mapI = L.map('map-insp').setView([14.65, -86.21], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapI);
        markerI = L.marker([14.65, -86.21], {draggable: true}).addTo(mapI);
        markerI.on('dragend', () => {
            let p = markerI.getLatLng();
            document.getElementById('coords-val-insp').innerText = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
        });
    }
}

function initMapPoda() {
    if (!mapP) {
        mapP = L.map('map-poda').setView([14.65, -86.21], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapP);
        markerP = L.marker([14.65, -86.21], {draggable: true}).addTo(mapP);
        setTimeout(() => mapP.invalidateSize(), 200);
    }
}

function marcarGPS(tipo) {
    let p = markerP.getLatLng();
    let coords = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    if(tipo === 'ini') {
        gpsIni = coords;
        document.getElementById('gps-ini').innerText = coords;
    } else {
        gpsFin = coords;
        document.getElementById('gps-fin').innerText = coords;
    }
}

// --- GENERACIÓN DE PDF PROFESIONAL ---
async function generarPDFPoda() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 15;
    let y = 25;

    // Título y Datos Básicos
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text("INFORME DE PODA COMUNITARIA - UTCD", margin, y);

    doc.setFontSize(10);
    doc.setTextColor(100);
    y += 10;
    doc.text(`SECTOR: JUTICALPA | ZONA: ${document.getElementById('zona-poda').value}`, margin, y);
    y += 7;
    doc.text(`GPS INICIO: ${gpsIni} | GPS FINAL: ${gpsFin}`, margin, y);
    y += 7;
    doc.text(`MÉTRICAS: Brecha: ${document.getElementById('brecha').value}m | Poda: ${document.getElementById('poda-m').value}m | Postes: ${document.getElementById('postes').value}`, margin, y);

    // Función para procesar y añadir imágenes al PDF
    const agregarImagenAlPDF = async (inputId, titulo, nuevaPagina = false) => {
        const file = document.getElementById(inputId).files[0];
        if (file) {
            if (nuevaPagina) doc.addPage();
            const imgData = await readFileAsDataURL(file);
            doc.setFontSize(12);
            doc.text(titulo, margin, 20);
            // Ajuste de imagen (Ancho, Alto)
            doc.addImage(imgData, 'JPEG', margin, 30, 180, 120);
        }
    };

    // Helper para leer archivo
    function readFileAsDataURL(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    // LISTADO DE FOTOS A PROCESAR (Se generan páginas según se necesite)
    // 1. Documentación Personal
    await agregarImagenAlPDF('f-grupo', "EVIDENCIA: GRUPO DE TRABAJO", true);
    await agregarImagenAlPDF('f-id-f', "DOCUMENTO: IDENTIDAD (FRENTE)", true);
    await agregarImagenAlPDF('f-id-r', "DOCUMENTO: IDENTIDAD (REVERSO)", true);

    // 2. Momentos (Aquí puedes expandir a las 3 de cada uno)
    await agregarImagenAlPDF('f-ini-1', "MOMENTO: INICIO (FOTO 1)", true);
    await agregarImagenAlPDF('f-ini-2', "MOMENTO: INICIO (FOTO 2)", true);
    await agregarImagenAlPDF('f-ini-3', "MOMENTO: INICIO (FOTO 3)", true);

    await agregarImagenAlPDF('f-eje-1', "MOMENTO: EJECUCIÓN (FOTO 1)", true);
    await agregarImagenAlPDF('f-eje-2', "MOMENTO: EJECUCIÓN (FOTO 2)", true);
    await agregarImagenAlPDF('f-eje-3', "MOMENTO: EJECUCIÓN (FOTO 3)", true);

    await agregarImagenAlPDF('f-fin-1', "MOMENTO: FINALIZACIÓN (FOTO 1)", true);
    await agregarImagenAlPDF('f-fin-2', "MOMENTO: FINALIZACIÓN (FOTO 2)", true);
    await agregarImagenAlPDF('f-fin-3', "MOMENTO: FINALIZACIÓN (FOTO 3)", true);

    await agregarImagenAlPDF('f-recibo', "COMPROBANTE: RECIBO DE CAJA", true);

    doc.save(`Informe_Poda_${new Date().toLocaleDateString()}.pdf`);
}
