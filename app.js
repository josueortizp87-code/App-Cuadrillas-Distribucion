/* ===============================
   VARIABLES GLOBALES
================================ */
var mapP, markerP;

var gpsIni = "No marcado";
var gpsFin = "No marcado";
var latIni = null, lngIni = null;
var latFin = null, lngFin = null;

/* ===============================
   LOGIN
================================ */
const USUARIOS = {
    admin: "admin123",
    supervisor: "super123"
};

function validarLogin() {
    const u = document.getElementById("user").value;
    const p = document.getElementById("pass").value;

    if (USUARIOS[u] && USUARIOS[u] === p) {
        document.getElementById("login-container").style.display = "none";
        document.getElementById("form-poda-container").style.display = "block";
        document.getElementById("user-display").innerText =
            "Usuario: " + u.toUpperCase();

        initMapPoda();
    } else {
        document.getElementById("login-error").style.display = "block";
    }
}

/* ===============================
   MAPA SATELITAL ESRI + GPS
================================ */
function initMapPoda() {
    if (mapP) mapP.remove();

    mapP = L.map("map-poda").setView([14.65, -86.21], 15);

    L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "© Esri" }
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
    const lat = parseFloat(document.getElementById("manual-lat").value);
    const lng = parseFloat(document.getElementById("manual-lng").value);

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
    const coord = lat + ", " + lng;

    if (tipo === "ini") {
        gpsIni = coord;
        latIni = lat;
        lngIni = lng;
    } else {
        gpsFin = coord;
        latFin = lat;
        lngFin = lng;
    }

    document.getElementById("coords-display").innerText =
        `Inicio: ${gpsIni} | Fin: ${gpsFin}`;
}

/* ===============================
   GENERAR PDF (BASE ESTABLE)
================================ */
async function generarPDFPoda() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Marco simple
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);

    doc.setFontSize(14);
    doc.text("INFORME DE PODA COMUNITARIA", 15, 20);

    doc.setFontSize(10);
    doc.text("Circuito: " + document.getElementById("poda-circuito").value, 15, 30);
    doc.text("Zona: " + document.getElementById("poda-zona").value, 15, 36);
    doc.text("Fecha: " + document.getElementById("poda-fecha").value, 15, 42);
    doc.text(
        "Hora: " +
        document.getElementById("h-ini").value +
        " - " +
        document.getElementById("h-fin").value,
        15,
        48
    );

    doc.text("GPS Inicio: " + gpsIni, 15, 54);
    doc.text("GPS Fin: " + gpsFin, 15, 60);

    doc.save("Informe_Poda_Final.pdf");
}

/* ===============================
   PREVISUALIZAR IMÁGENES
================================ */
function previsualizar(input, idContenedor) {
    const cont = document.getElementById(idContenedor);
    cont.innerHTML = "";

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            cont.appendChild(img);
        };
        reader.readAsDataURL(input.files[0]);
    }
}
