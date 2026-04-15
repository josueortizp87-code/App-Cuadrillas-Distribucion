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
        if(document.getElementById(id)) document.getElementById(id).style.display = 'none';
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

    // PÁGINA 1: DATOS GENERALES Y GRUPO
    dibujarMarco();
    doc.setFontSize(14);
    doc.text("INFORME DE PODA COMUNITARIA SECTOR: JUTICALPA", 15, 20);
    doc.setFontSize(10);
    doc.text(`CIRCUITO: ${document.getElementById('poda-circuito').value}`, 15, 30);
    doc.text(`ZONA DE TRABAJO: ${document.getElementById('poda-zona').value}`, 15, 36);
    doc.text(`FECHA: ${document.getElementById('poda-fecha').value}`, 15, 42);
    doc.text(`HORA INICIO: ${document.getElementById('h-ini').value} | HORA FINAL: ${document.getElementById('h-fin').value}`, 15, 48);
    doc.text(`GPS INICIAL: ${gpsIni} | GPS FINAL: ${gpsFin}`, 15, 54);
    doc.text(`METROS BRECHA: ${document.getElementById('m-brecha').value} | PODA: ${document.getElementById('m-poda').value} | POSTES: ${document.getElementById('m-postes').value}`, 15, 60);
    doc.text(`PERSONAS: ${document.getElementById('poda-personas').value} | MO: L${document.getElementById('pago-mo').value} | TRANS: L${document.getElementById('pago-trans').value}`, 15, 66);
    doc.text(`RESPONSABLE SUP: ${document.getElementById('resp-super').value}`, 15, 72);
    doc.text(`RESPONSABLE ACT: ${document.getElementById('resp-activ').value}`, 15, 78);

    const fGrupo = await leerFoto('f-grupo');
    if(fGrupo) {
        doc.text("EVIDENCIA GRUPAL:", 15, 90);
        doc.rect(14, 94, 172, 102);
        doc.addImage(fGrupo, 'JPEG', 15, 95, 170, 100);
    }

    // PÁGINA 2 Y 3: IDENTIDADES
    doc.addPage(); dibujarMarco();
    const idF = await leerFoto('f-id-f');
    if(idF) { doc.text("IDENTIDAD (FRENTE):", 15, 20); doc.rect(14, 29, 172, 112); doc.addImage(idF, 'JPEG', 15, 30, 170, 110); }

    doc.addPage(); dibujarMarco();
    const idR = await leerFoto('f-id-r');
    if(idR) { doc.text("IDENTIDAD (REVÉS):", 15, 20); doc.rect(14, 29, 172, 112); doc.addImage(idR, 'JPEG', 15, 30, 170, 110); }

    // PÁGINA 4: 9 FOTOS CON TÍTULOS (3x3)
    doc.addPage(); dibujarMarco();
    doc.setFontSize(12);

    const secciones = [
        { titulo: "FOTOS ANTES", ids: ['f-ini-1', 'f-ini-2', 'f-ini-3'] },
        { titulo: "FOTOS DURANTE", ids: ['f-eje-1', 'f-eje-2', 'f-eje-3'] },
        { titulo: "FOTOS DESPUÉS", ids: ['f-fin-1', 'f-fin-2', 'f-fin-3'] }
    ];

    let yActual = 20;
    for (let s = 0; s < secciones.length; s++) {
        doc.setFontSize(11);
        doc.text(secciones[s].titulo, 15, yActual);
        yActual += 5;

        let xActual = 15;
        for (let i = 0; i < secciones[s].ids.length; i++) {
            const img = await leerFoto(secciones[s].ids[i]);
            if (img) {
                doc.setDrawColor(150);
                doc.rect(xActual - 0.5, yActual - 0.5, 56, 41); // Marco de la miniatura
                doc.addImage(img, 'JPEG', xActual, yActual, 55, 40);
            }
            xActual += 60;
        }
        yActual += 50; // Salto de fila para la siguiente sección
    }

    // PÁGINA 5: RECIBO
    doc.addPage(); dibujarMarco();
    const recibo = await leerFoto('f-recibo');
    if(recibo) {
        doc.text("RECIBO DE CAJA FINAL:", 15, 20);
        doc.rect(14, 29, 172, 222);
        doc.addImage(recibo, 'JPEG', 15, 30, 170, 220);
    }

    doc.save(`Poda_${document.getElementById('poda-zona').value}.pdf`);
}
