var mapP, markerP;
var gpsIni = "No marcado", gpsFin = "No marcado";
var currentSector = "";

// SISTEMA DE USUARIOS
function validarLogin() {
    const sector = document.getElementById('user-sector').value;
    const pass = document.getElementById('pass').value;
    
    // Contraseña maestra para sectores y admin
    if (pass === "enee2026" || (sector === "ADMIN" && pass === "admin123")) {
        currentSector = sector;
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('form-poda-container').style.display = 'block';
        document.getElementById('header-sector-title').innerText = `SECTOR ${sector} - PODA COMUNITARIA`;
        document.getElementById('user-display').innerText = "SESIÓN ACTIVA: " + sector;
        initMapPoda();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

// MAPA ESRI SATELITAL
function initMapPoda() {
    if (mapP) mapP.remove();
    mapP = L.map('map-poda').setView([14.65, -86.21], 15);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    }).addTo(mapP);

    markerP = L.marker([14.65, -86.21], { draggable: true }).addTo(mapP);
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            mapP.setView([pos.coords.latitude, pos.coords.longitude], 17);
            markerP.setLatLng([pos.coords.latitude, pos.coords.longitude]);
        });
    }
}

function ingresarManual() {
    const lat = parseFloat(document.getElementById('manual-lat').value);
    const lng = parseFloat(document.getElementById('manual-lng').value);
    if (!isNaN(lat) && !isNaN(lng)) {
        mapP.setView([lat, lng], 17);
        markerP.setLatLng([lat, lng]);
    }
}

function marcarGPS(tipo) {
    let p = markerP.getLatLng();
    let c = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    if (tipo === 'ini') gpsIni = c; else gpsFin = c;
    document.getElementById('coords-display').innerText = `Inicio: ${gpsIni} | Fin: ${gpsFin}`;
}

// GENERACIÓN DE PDF PROFESIONAL
function dibujarEncabezado(doc, sector) {
    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277); // Marco de la hoja
    doc.line(10, 30, 200, 30);  // Base encabezado
    doc.line(60, 10, 60, 30);   // Divisor logo
    doc.line(140, 10, 140, 30); // Divisor título
    doc.line(140, 17, 200, 17); // Divisor Código
    doc.line(140, 24, 200, 24); // Divisor Versión
    doc.line(165, 10, 165, 30); // Divisor etiquetas

    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("UTCD", 35, 18, {align:"center"});
    doc.setFontSize(6); doc.text("UNIDAD TÉCNICA DE CONTROL\nDE DISTRIBUCIÓN", 35, 23, {align:"center"});
    
    doc.setFontSize(9);
    doc.text("INFORME DE PODA COMUNITARIA", 100, 18, {align:"center"});
    doc.text(`SECTOR ${sector}`, 100, 23, {align:"center"});

    doc.setFontSize(7);
    doc.text("Código", 142, 15);
    doc.text("Versión", 142, 22); doc.text("1", 182, 22);
    doc.text("Fecha", 142, 28); doc.text(new Date().toLocaleDateString(), 170, 28);
}

async function generarPDFPoda() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const leerFoto = (id) => {
        const f = document.getElementById(id).files[0];
        if (!f) return null;
        return new Promise(r => { const reader = new FileReader(); reader.onload = (e) => r(e.target.result); reader.readAsDataURL(f); });
    };

    // PÁGINA 1: DATOS Y PRINCIPALES
    dibujarEncabezado(doc, currentSector);
    doc.setFillColor(245, 245, 245); doc.rect(15, 35, 180, 45, 'F'); doc.rect(15, 35, 180, 45);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    let y = 42;
    const labels = [
        ["Circuito:", document.getElementById('poda-circuito').value],
        ["Zona de Trabajo:", document.getElementById('poda-zona').value],
        ["Fecha:", document.getElementById('poda-fecha').value],
        ["Hora Inicio/Fin:", `${document.getElementById('h-ini').value} a ${document.getElementById('h-fin').value}`],
        ["Trabajo:", `${document.getElementById('m-brecha').value}m Brecha, ${document.getElementById('m-poda').value}m Poda`],
        ["GPS Inicio/Fin:", `${gpsIni} / ${gpsFin}`]
    ];
    labels.forEach(l => { doc.setFont("helvetica", "bold"); doc.text(l[0], 20, y); doc.setFont("helvetica", "normal"); doc.text(l[1], 55, y); y+=7; });

    const fG = await leerFoto('f-grupo');
    const fV = await leerFoto('f-vehiculo');
    if(fG && fV) {
        doc.addImage(fG, 'JPEG', 20, 85, 170, 95); doc.rect(20, 85, 170, 95);
        doc.addImage(fV, 'JPEG', 20, 185, 170, 95); doc.rect(20, 185, 170, 95);
    } else if(fG) {
        doc.addImage(fG, 'JPEG', 15, 85, 180, 120); doc.rect(15, 85, 180, 120);
    }

    // PÁGINA 2: LÍDER
    const fLF = await leerFoto('f-lider-f');
    const fLR = await leerFoto('f-lider-r');
    if(fLF || fLR) {
        doc.addPage(); dibujarEncabezado(doc, currentSector);
        doc.setFont("helvetica", "bold"); doc.text("LIDER DE CUADRILLA", 105, 45, {align:"center"});
        if(fLF) { doc.addImage(fLF, 'JPEG', 55, 60, 100, 75); doc.rect(55, 60, 100, 75); }
        if(fLR) { doc.addImage(fLR, 'JPEG', 55, 150, 100, 75); doc.rect(55, 150, 100, 75); }
    }

    // PÁGINA 3: DNI FRENTE BENEFICIARIO
    const fIDF = await leerFoto('f-id-f');
    if(fIDF) { doc.addPage(); dibujarEncabezado(doc, currentSector); doc.text("DNI FRENTE", 105, 45, {align:"center"}); doc.addImage(fIDF, 'JPEG', 30, 60, 150, 110); doc.rect(30, 60, 150, 110); }

    // PÁGINA 4: DNI REVÉS BENEFICIARIO
    const fIDR = await leerFoto('f-id-r');
    if(fIDR) { doc.addPage(); dibujarEncabezado(doc, currentSector); doc.text("DNI REVÉS", 105, 45, {align:"center"}); doc.addImage(fIDR, 'JPEG', 30, 60, 150, 110); doc.rect(30, 60, 150, 110); }

    // PÁGINA 5: CAMPO
    doc.addPage(); dibujarEncabezado(doc, currentSector);
    let fA = await leerFoto('f-ini-1'), fD = await leerFoto('f-eje-1'), fDS = await leerFoto('f-fin-1');
    if(fA) { doc.text("ANTES", 45, 45); doc.addImage(fA, 'JPEG', 15, 50, 180, 70); doc.rect(15, 50, 180, 70); }
    if(fD) { doc.text("DURANTE", 45, 125); doc.addImage(fD, 'JPEG', 15, 130, 180, 70); doc.rect(15, 130, 180, 70); }
    if(fDS) { doc.text("DESPUÉS", 45, 205); doc.addImage(fDS, 'JPEG', 15, 210, 180, 70); doc.rect(15, 210, 180, 70); }

    doc.save(`Informe_Poda_${currentSector}.pdf`);
}

function previsualizar(input, id) {
    const box = document.getElementById(id); box.innerHTML = "";
    if (input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => { const img = document.createElement('img'); img.src = e.target.result; img.style.width="100%"; img.style.height="100%"; img.style.objectFit="cover"; box.appendChild(img); };
        reader.readAsDataURL(input.files[0]);
    }
}
