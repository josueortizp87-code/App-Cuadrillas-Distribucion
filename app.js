/* =============================
   VARIABLES GLOBALES
============================= */
var mapP, markerP;

var gpsIni = "No marcado", gpsFin = "No marcado";
var latIni = null, lngIni = null;
var latFin = null, lngFin = null;

// Usuario / sector (temporal – luego se hará dinámico)
let sectorUsuario = "COMAYAGUA";

/* =============================
   LOGIN BÁSICO
============================= */
const USUARIOS = {
    "admin": "admin123",
    "supervisor": "super123"
};

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
   MAPA ESRI SATELITAL + GPS
============================= */
function initMapPoda() {
    if (mapP) mapP.remove();

    mapP = L.map('map-poda').setView([14.65, -86.21], 15);

    L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles © Esri' }
    ).addTo(mapP);

    markerP = L.marker([14.65, -86.21], { draggable: true }).addTo(mapP);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            actualizarMarcador(pos.coords.latitude, pos.coords.longitude);
        });
    }

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
        gpsIni = c;
        latIni = lat;
        lngIni = lng;
    } else {
        gpsFin = c;
        latFin = lat;
        lngFin = lng;
    }

    document.getElementById('coords-display').innerText =
        `Inicio: ${gpsIni} | Fin: ${gpsFin}`;
}

/* =============================
   ENCABEZADO INSTITUCIONAL PDF
============================= */
function dibujarEncabezadoPDF(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerHeight = 25;

    // Marco general
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, headerHeight);

    // Logo / UTCD (texto por ahora)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("UTCD", 14, 20);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Unidad Técnica de Control", 14, 24);

    // Título central
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(
        "INFORME DE PODA COMUNITARIA",
        pageWidth / 2,
        18,
        { align: "center" }
    );

    doc.setFontSize(10);
    doc.text(
        `SECTOR ${sectorUsuario}`,
        pageWidth / 2,
        23,
        { align: "center" }
    );

    // Cajetín derecho
    const boxX = pageWidth - 60;
    doc.rect(boxX, 10, 50, headerHeight);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Código:", boxX + 2, 15);
    doc.text("Versión: 1", boxX + 2, 20);
    doc.text("Fecha:", boxX + 2, 25);
}

/* =============================
   GENERAR PDF PRO (BASE)
============================= */
async function generarPDFPoda() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // ======== PÁGINA 1 ========
    dibujarEncabezadoPDF(doc);

    const startY = 45;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    doc.text("Circuito:", 15, startY);
    doc.text("Zona de trabajo:", 15, startY + 6);
    doc.text("Fecha:", 15, startY + 12);
    doc.text("Hora:", 15, startY + 18);
    doc.text("GPS:", 15, startY + 24);

    doc.setFont("helvetica", "normal");
    doc.text(document.getElementById('poda-circuito').value, 45, startY);
    doc.text(document.getElementById('poda-zona').value, 45, startY + 6);
    doc.text(document.getElementById('poda-fecha').value, 45, startY + 12);
    doc.text(
        `${document.getElementById('h-ini').value} - ${document.getElementById('h-fin').value}`,
        45,
        startY + 18
    );
    doc.text(`Inicio ${gpsIni} / Fin ${gpsFin}`, 45, startY + 24);

    doc.rect(12, startY - 5, 185, 35);

    // ===== FOTOS GRUPO / VEHÍCULO =====
    const leerFoto = (id) => {
        const file = document.getElementById(id).files[0];
        if (!file) return null;
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    };

    const fGrupo = await leerFoto('f-grupo');
    const fVehiculo = await leerFoto('f-vehiculo');

    if (!fGrupo) {
        alert("La foto GRUPO es obligatoria.");
        return;
    }

    let fotoY = startY + 40;

    doc.setFont("helvetica", "bold");
    doc.text("EVIDENCIA GRUPAL", 15, fotoY);
    doc.addImage(fGrupo, 'JPEG', 15, fotoY + 5, 180, fVehiculo ? 40 : 80);
    doc.rect(15, fotoY + 5, 180, fVehiculo ? 40 : 80);

    if (fVehiculo) {
        let vehY = fotoY + 55;
        doc.text("EVIDENCIA VEHÍCULO", 15, vehY);
        doc.addImage(fVehiculo, 'JPEG', 15, vehY + 5, 180, 40);
        doc.rect(15, vehY + 5, 180, 40);
    }

    // ===== Guardar PDF =====
    doc.save("Informe_Poda_Final.pdf");
}

/* =============================
   PREVISUALIZAR FOTOS
============================= */
function previsualizar(input, idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.innerHTML = "";

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            contenedor.appendChild(img);
        };
        reader.readAsDataURL(input.files[0]);
    }
}
