var mapI, mapP, markerI, markerP;
var gpsIni = "No definido", gpsFin = "No definido";

function mostrarSubmenu() {
    ocultarTodo();
    document.getElementById('submenu-mantenimiento').style.display = 'block';
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

async function generarPDFPoda() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

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

    // PÁGINA 1: DATOS COMPLETOS SEGÚN FORMATO
    dibujarMarco();
    doc.setFontSize(14);
    doc.text("INFORME DE PODA COMUNITARIA SECTOR: JUTICALPA", 15, 20);

    doc.setFontSize(10);
    doc.text(`CIRCUITO: ${document.getElementById('poda-circuito').value}`, 15, 30);
    doc.text(`ZONA DE TRABAJO: ${document.getElementById('poda-zona').value}`, 15, 36);
    doc.text(`FECHA: ${document.getElementById('poda-fecha').value}`, 15, 42);
    doc.text(`HORA INICIO TRABAJO: ${document.getElementById('h-ini').value}    HORA FINAL TRABAJO: ${document.getElementById('h-fin').value}`, 15, 48);
    doc.text(`PUNTO GPS INICIAL: ${gpsIni}; PUNTO GPS FINAL: ${gpsFin}`, 15, 54);
    doc.text(`METROS DE BRECHA: ${document.getElementById('m-brecha').value}; METROS DE PODA: ${document.getElementById('m-poda').value}; POSTES RONDADOS: ${document.getElementById('m-postes').value}`, 15, 60);
    doc.text(`PERSONAS CONTRATADAS: ${document.getElementById('poda-personas').value}`, 15, 66);
    doc.text(`CANTIDAD PAGADA EN MANO DE OBRA: L${document.getElementById('pago-mo').value}`, 15, 72);
    doc.text(`CANTIDAD PAGADA EN TRANSPORTE: L${document.getElementById('pago-trans').value}`, 15, 78);
    doc.text(`RESPONSABLE SUPERVISION: ${document.getElementById('resp-super').value}`, 15, 84);
    doc.text(`RESPONSABLE ACTIVIDADES: ${document.getElementById('resp-activ').value}`, 15, 90);

    const fGrupo = await leerFoto('f-grupo');
    if(fGrupo) {
        doc.text("EVIDENCIA GRUPAL:", 15, 100);
        doc.rect(14, 104, 172, 102);
        doc.addImage(fGrupo, 'JPEG', 15, 105, 170, 100);
    }

    // PÁGINA 2: ID FRENTE
    doc.addPage(); dibujarMarco();
    const idF = await leerFoto('f-id-f');
    if(idF) {
        doc.text("IDENTIDADES - FRENTE:", 15, 20);
        doc.rect(14, 29, 172, 112);
        doc.addImage(idF, 'JPEG', 15, 30, 170, 110);
    }

    // PÁGINA 3: ID REVÉS
    doc.addPage(); dibujarMarco();
    const idR = await leerFoto('f-id-r');
    if(idR) {
        doc.text("IDENTIDADES - REVÉS:", 15, 20);
        doc.rect(14, 29, 172, 112);
        doc.addImage(idR, 'JPEG', 15, 30, 170, 110);
    }

    // PÁGINA 4: 9 FOTOS DE CAMPO
    doc.addPage(); dibujarMarco();
    doc.text("EVIDENCIA DE CAMPO (INICIO, EJECUCIÓN Y FINAL):", 15, 15);
    const fotosCampo = ['f-ini-1','f-ini-2','f-ini-3','f-eje-1','f-eje-2','f-eje-3','f-fin-1','f-fin-2','f-fin-3'];
    let x = 15, y = 20;
    for(let i=0; i<fotosCampo.length; i++) {
        const img = await leerFoto(fotosCampo[i]);
        if(img) {
            doc.rect(x-1, y-1, 57, 42);
            doc.addImage(img, 'JPEG', x, y, 55, 40);
        }
        x += 60;
        if((i+1)%3 === 0) { x = 15; y += 45; }
    }

    // PÁGINA 5: RECIBO
    doc.addPage(); dibujarMarco();
    const recibo = await leerFoto('f-recibo');
    if(recibo) {
        doc.text("RECIBO DE CAJA FINAL:", 15, 20);
        doc.rect(14, 29, 172, 212);
        doc.addImage(recibo, 'JPEG', 15, 30, 170, 210);
    }

    doc.save(`Informe_Poda_${document.getElementById('poda-zona').value}.pdf`);
}
