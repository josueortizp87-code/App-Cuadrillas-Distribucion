/* =============================
   VARIABLES GLOBALES GPS
============================= */
var mapP, markerP;
var gpsIni = "No marcado", gpsFin = "No marcado";
var latIni = null, lngIni = null;
var latFin = null, lngFin = null;

let sectorUsuario = "COMAYAGUA";

/* =============================
   LOGIN
============================= */
const USUARIOS = { admin: "admin123", supervisor: "super123" };

function validarLogin() {
    const u = document.getElementById('user').value;
    const p = document.getElementById('pass').value;

    if (USUARIOS[u] && USUARIOS[u] === p) {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('form-poda-container').style.display = 'block';
        document.getElementById('user-display').innerText =
            "Usuario: " + u.toUpperCase() + " | Sector: " + sectorUsuario;
        initMapPoda();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

/* =============================
   MAPA ESRI + GPS
============================= */
function initMapPoda() {
    if (mapP) mapP.remove();

    mapP = L.map('map-poda').setView([14.65, -86.21], 15);

    L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri' }
    ).addTo(mapP);

    markerP = L.marker([14.65, -86.21], { draggable: true }).addTo(mapP);

    navigator.geolocation?.getCurrentPosition(pos =>
        actualizarMarcador(pos.coords.latitude, pos.coords.longitude)
    );

    setTimeout(() => mapP.invalidateSize(), 300);
}

function actualizarMarcador(lat, lng) {
    mapP.setView([lat, lng], 17);
    markerP.setLatLng([lat, lng]);
}

function ingresarManual() {
    const lat = parseFloat(document.getElementById('manual-lat').value);
    const lng = parseFloat(document.getElementById('manual-lng').value);
    if (!isNaN(lat) && !isNaN(lng)) {
        actualizarMarcador(lat, lng);
    } else {
        alert("Ingrese coordenadas válidas");
    }
}

function marcarGPS(tipo) {
    const p = markerP.getLatLng();
    const lat = Number(p.lat.toFixed(6));
    const lng = Number(p.lng.toFixed(6));
    const c = lat + ", " + lng;

    if (tipo === 'ini') {
        gpsIni = c; latIni = lat; lngIni = lng;
    } else {
        gpsFin = c; latFin = lat; lngFin = lng;
    }

    document.getElementById('coords-display').innerText =
        `Inicio: ${gpsIni} | Fin: ${gpsFin}`;
}

/* =============================
   ENCABEZADO SIN LOGO (ESTABLE)
============================= */
function dibujarEncabezadoPDF(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const y = 10, h = 28;

    // Izquierda
    doc.rect(10, y, 40, h);
    doc.setFont("helvetica", "bold");
    doc.text("UTCD", 20, y + 16);

    // Centro
    doc.rect(50, y, pageWidth - 120, h);
    doc.text("INFORME DE PODA COMUNITARIA", pageWidth / 2, y + 14, { align: "center" });
    doc.text(`SECTOR ${sectorUsuario}`, pageWidth / 2, y + 22, { align: "center" });

    // Derecha
    const cx = pageWidth - 60;
    doc.rect(cx, y, 50, h);
    doc.setFontSize(7);
    doc.text("Código:", cx + 3, y + 8);
    doc.text("Versión: 1", cx + 3, y + 16);
    doc.text("Fecha:", cx + 3, y + 24);
}

/* =============================
   PDF (solo prueba estable)
============================= */
async function generarPDFPoda() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    dibujarEncabezadoPDF(doc);

    doc.text("PRUEBA DE PDF ESTABLE", 20, 50);
    doc.text(`GPS: ${gpsIni} / ${gpsFin}`, 20, 60);

    doc.save("Informe_Poda_Final.pdf");
}

/* =============================
   PREVISUALIZACIÓN
============================= */
function previsualizar(input, idContenedor) {
    const cont = document.getElementById(idContenedor);
    cont.innerHTML = "";
    if (input.files && input.files[0]) {
        const r = new FileReader();
        r.onload = e => {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            cont.appendChild(img);
        };
        r.readAsDataURL(input.files[0]);
    }
}
