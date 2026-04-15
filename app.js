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

    // --- PÁGINA 1: DATOS Y GRUPO ---
    dibujarMarco();
    doc.setFontSize(14);
    doc.text("INFORME DE PODA COMUNITARIA SECTOR: JUTICALPA", 15, 20);
    doc.setFontSize(10);
    doc.text(`CIRCUITO: ${document.getElementById('poda-circuito').value} | ZONA: ${document.getElementById('poda-zona').value}`, 15, 28);
    doc.text(`FECHA: ${document.getElementById('poda-fecha').value} | GPS: ${gpsIni} / ${gpsFin}`, 15, 34);
    doc.text(`MÉTRICAS: Brecha ${document.getElementById('m-brecha').value}m | Poda ${document.getElementById('m-poda').value}m | Postes ${document.getElementById('m-postes').value}`, 15, 40);
    doc.text(`PAGOS: MO L${document.getElementById('pago-mo').value} | Trans L${document.getElementById('pago-trans').value} | Personas: ${document.getElementById('poda-personas').value}`, 15, 46);

    const fGrupo = await leerFoto('f-grupo');
    if(fGrupo) {
        doc.text("EVIDENCIA GRUPAL:", 15, 56);
        // Foto más grande en la primera página
        doc.addImage(fGrupo, 'JPEG', 10, 60, 190, 130);
        doc.rect(10, 60, 190, 130);
    }

    // --- PÁGINA 2 Y 3: IDENTIDADES (AJUSTE A TODA LA HOJA) ---
    const idsPaginas = [{id: 'f-id-f', tit: 'IDENTIDAD FRENTE'}, {id: 'f-id-r', tit: 'IDENTIDAD REVÉS'}];
    for (let p of idsPaginas) {
        doc.addPage(); dibujarMarco();
        const img = await leerFoto(p.id);
        if(img) {
            doc.text(p.tit, 15, 15);
            doc.addImage(img, 'JPEG', 10, 20, 190, 260); // Cubre casi toda la hoja
            doc.rect(10, 20, 190, 260);
        }
    }

    // --- PÁGINA 4: 9 FOTOS (MÁXIMO APROVECHAMIENTO) ---
    doc.addPage(); dibujarMarco();
    const secciones = [
        { titulo: "FOTOS ANTES", ids: ['f-ini-1', 'f-ini-2', 'f-ini-3'] },
        { titulo: "FOTOS DURANTE", ids: ['f-eje-1', 'f-eje-2', 'f-eje-3'] },
        { titulo: "FOTOS DESPUÉS", ids: ['f-fin-1', 'f-fin-2', 'f-fin-3'] }
    ];

    let yPos = 15;
    const fotoAncho = 62;
    const fotoAlto = 78; // Aumentado para cubrir más espacio vertical

    for (let s of secciones) {
        doc.setFontSize(12);
        doc.text(s.titulo, 15, yPos);
        yPos += 5;

        let xPos = 10;
        for (let id of s.ids) {
            const img = await leerFoto(id);
            if (img) {
                doc.addImage(img, 'JPEG', xPos, yPos, fotoAncho, fotoAlto);
                doc.rect(xPos, yPos, fotoAncho, fotoAlto);
            }
            xPos += 64;
        }
        yPos += fotoAlto + 10; // Espacio para la siguiente sección
    }

    // --- PÁGINA 5: RECIBO (AJUSTE A TODA LA HOJA) ---
    doc.addPage(); dibujarMarco();
    const recibo = await leerFoto('f-recibo');
    if(recibo) {
        doc.text("RECIBO DE CAJA FINAL", 15, 15);
        doc.addImage(recibo, 'JPEG', 10, 20, 190, 260);
        doc.rect(10, 20, 190, 260);
    }

    doc.save(`Informe_Poda_${document.getElementById('poda-zona').value}.pdf`);
}
