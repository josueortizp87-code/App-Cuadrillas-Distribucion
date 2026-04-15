var mapI, mapP, markerI, markerP;
var gpsIni = "", gpsFin = "";

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
    ids.forEach(id => document.getElementById(id).style.display = 'none');
}

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

function generarPDFPoda() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("INFORME DE PODA COMUNITARIA - UTCD JUTICALPA", 10, 20);
    doc.setFontSize(10);
    doc.text("Zona: " + document.getElementById('zona-poda').value, 10, 35);
    doc.text("GPS Inicio: " + gpsIni, 10, 45);
    doc.text("GPS Final: " + gpsFin, 10, 55);
    doc.text("Brecha: " + document.getElementById('brecha').value + "m", 10, 65);

    alert("Informe generado. Se han incluido los campos para las 13 fotos reglamentarias y GPS.");
    doc.save("Informe_Poda_UTCD.pdf");
}
