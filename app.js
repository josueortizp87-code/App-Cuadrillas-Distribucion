var mapI, mapP, markerI, markerP;
var gpsIni = "0,0", gpsFin = "0,0";

// --- NAVEGACIÓN ---
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
        initMap('map-insp', 'markerI');
    } else if(tipo === 'poda') {
        document.getElementById('form-poda-container').style.display = 'block';
        initMap('map-poda', 'markerP');
    }
    window.scrollTo(0,0);
}

function volverAlDashboard() {
    ocultarTodo();
    document.getElementById('dashboard').style.display = 'block';
}

function ocultarTodo() {
    ['dashboard','submenu-mantenimiento','form-inspeccion-container','form-poda-container'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

// --- GPS ---
function initMap(mapId, markerVar) {
    let m = L.map(mapId).setView([14.65, -86.21], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m);
    let marker = L.marker([14.65, -86.21], {draggable: true}).addTo(m);
    if(markerVar === 'markerI') markerI = marker; else markerP = marker;
    setTimeout(() => m.invalidateSize(), 200);
}

function marcarGPS(tipo) {
    let p = markerP.getLatLng();
    let c = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    if(tipo === 'ini') gpsIni = c; else gpsFin = c;
    document.getElementById('coords-display').innerText = `Inicio: ${gpsIni} | Fin: ${gpsFin}`;
}

// --- PDF DE 5 PÁGINAS ---
async function generarPDFPoda() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 10;

    // Función para dibujar marco de página
    const dibujarMarco = () => {
        doc.setDrawColor(40);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
    };

    const leerFoto = (id) => {
        const file = document.getElementById(id).files[0];
        if (!file) return null;
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    };

    // PÁGINA 1: DATOS Y FOTO GRUPAL
    dibujarMarco();
    doc.setFontSize(16);
    doc.text("INFORME DE PODA COMUNITARIA - UTCD", 20, 20);
    doc.setFontSize(10);
    doc.text(`CIRCUITO: ${document.getElementById('poda-circuito').value}`, 20, 30);
    doc.text(`ZONA: ${document.getElementById('poda-zona').value}`, 20, 35);
    doc.text(`GPS: ${gpsIni} / ${gpsFin}`, 20, 40);
    doc.text(`MÉTRICAS: Brecha ${document.getElementById('m-brecha').value}m | Poda ${document.getElementById('m-poda').value}m`, 20, 45);

    const fotoGrupo = await leerFoto('f-grupo');
    if(fotoGrupo) {
        doc.text("EVIDENCIA GRUPAL:", 20, 60);
        doc.rect(19, 64, 172, 102); // Marco foto
        doc.addImage(fotoGrupo, 'JPEG', 20, 65, 170, 100);
    }

    // PÁGINA 2: ID FRENTE
    doc.addPage(); dibujarMarco();
    const idF = await leerFoto('f-id-f');
    if(idF) {
        doc.text("IDENTIDADES - FRENTE:", 20, 20);
        doc.rect(19, 29, 172, 112);
        doc.addImage(idF, 'JPEG', 20, 30, 170, 110);
    }

    // PÁGINA 3: ID REVÉS
    doc.addPage(); dibujarMarco();
    const idR = await leerFoto('f-id-r');
    if(idR) {
        doc.text("IDENTIDADES - REVÉS:", 20, 20);
        doc.rect(19, 29, 172, 112);
        doc.addImage(idR, 'JPEG', 20, 30, 170, 110);
    }

    // PÁGINA 4: CUADRÍCULA DE 9 FOTOS (Inicio, Eje, Fin)
    doc.addPage(); dibujarMarco();
    doc.text("EVIDENCIA DE CAMPO (INICIO, EJECUCIÓN Y FINAL):", 20, 15);
    const fotosCampo = ['f-ini-1','f-ini-2','f-ini-3','f-eje-1','f-eje-2','f-eje-3','f-fin-1','f-fin-2','f-fin-3'];
    let x = 15, y = 20;
    for(let i=0; i<fotosCampo.length; i++) {
        const img = await leerFoto(fotosCampo[i]);
        if(img) {
            doc.rect(x-1, y-1, 57, 42); // Marco miniatura
            doc.addImage(img, 'JPEG', x, y, 55, 40);
        }
        x += 60;
        if((i+1)%3 === 0) { x = 15; y += 45; }
    }

    // PÁGINA 5: RECIBO
    doc.addPage(); dibujarMarco();
    const recibo = await leerFoto('f-recibo');
    if(recibo) {
        doc.text("RECIBO DE CAJA FINAL:", 20, 20);
        doc.rect(19, 29, 172, 202);
        doc.addImage(recibo, 'JPEG', 20, 30, 170, 200);
    }

    doc.save("Informe_Poda_UTCD_Final.pdf");
}
