/* =================================================
   VARIABLES GLOBALES
================================================= */
var mapP, markerP;
var gpsIni = "No marcado", gpsFin = "No marcado";
var latIni = null, lngIni = null;
var latFin = null, lngFin = null;

// Sector asignado al usuario (temporal)
let sectorUsuario = "COMAYAGUA";

/* =================================================
   LOGO ENEE (BASE64)
================================================= */
/*
PASO IMPORTANTE:
1. Abre el logo ENEE en https://base64.guru/converter/encode/image
2. Copia SOLO la cadena Base64
3. Reemplaza el contenido de LOGO_ENEE_BASE64
*/
const LOGO_ENEE_BASE64 =
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."; // EJEMPLO

/* =================================================
   LOGIN
================================================= */
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

/* =================================================
   MAPA ESRI
================================================= */
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

/* =================================================
   ENCABEZADO UTCD INSTITUCIONAL
================================================= */
function dibujarEncabezadoPDF(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerY = 10;
    const headerH = 28;

    // Cajetín izquierdo (LOGO)
    doc.rect(10, headerY, 40, headerH);
    doc.addImage(LOGO_ENEE_BASE64, "PNG", 12, headerY + 4, 32, 20);

    // Cajetín central (INFORME)
    doc.rect(50, headerY, pageWidth - 120, headerH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INFORME DE PODA COMUNITARIA", pageWidth / 2, headerY + 12, { align: "center" });
    doc.setFontSize(10);
    doc.text(`SECTOR ${sectorUsuario}`, pageWidth / 2, headerY + 20, { align: "center" });

    // Cajetín derecho (CONTROL)
    const ctrlX = pageWidth - 60;
    doc.rect(ctrlX, headerY, 50, headerH);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Código:", ctrlX + 3, headerY + 8);
    doc.text("Versión: 1", ctrlX + 3, headerY + 15);
    doc.text("Fecha:", ctrlX + 3, headerY + 22);
}

/* =================================================
   AYUDA: DIBUJAR IMAGEN SIN DISTORSIÓN
================================================= */
function agregarImagenProporcional(doc, imgData, x, y, maxW, maxH) {
    const props = doc.getImageProperties(imgData);
    const ratio = props.width / props.height;

    let w = maxW;
    let h = w / ratio;

    if (h > maxH) {
        h = maxH;
        w = h * ratio;
    }

    doc.addImage(imgData, "JPEG", x, y, w, h);
    doc.rect(x, y, w, h);
}

/* =================================================
   GENERAR PDF — HOJA 1 PROFESIONAL
================================================= */
async function generarPDFPoda() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    dibujarEncabezadoPDF(doc);

    const leerFoto = id => {
        const f = document.getElementById(id).files[0];
        if (!f) return null;
        return new Promise(res => {
            const r = new FileReader();
            r.onload = e => res(e.target.result);
            r.readAsDataURL(f);
        });
    };

    const fGrupo = await leerFoto("f-grupo");
    const fVehiculo = await leerFoto("f-vehiculo");

    if (!fGrupo) {
        alert("La foto GRUPO es obligatoria.");
        return;
    }

    const baseY = 45;

    // Cuadro de información
    doc.setFont("helvetica", "bold");
    doc.text("Circuito:", 15, baseY);
    doc.text("Zona:", 15, baseY + 6);
    doc.text("Fecha:", 15, baseY + 12);
    doc.text("Hora:", 15, baseY + 18);
    doc.text("GPS:", 15, baseY + 24);

    doc.setFont("helvetica", "normal");
    doc.text(poda-circuito.value, 45, baseY);
    doc.text(poda-zona.value, 45, baseY + 6);
    doc.text(poda-fecha.value, 45, baseY + 12);
    doc.text(h-ini.value + " - " + h-fin.value, 45, baseY + 18);
    doc.text("Inicio " + gpsIni + " / Fin " + gpsFin, 45, baseY + 24);

    doc.rect(12, baseY - 5, 185, 35);

    // Fotos
    let fotosY = baseY + 40;

    doc.setFont("helvetica", "bold");
    doc.text("EVIDENCIA GRUPAL", 15, fotosY);
    agregarImagenProporcional(doc, fGrupo, 15, fotosY + 5, 180, fVehiculo ? 38 : 80);

    if (fVehiculo) {
        let vY = fotosY + 48;
        doc.text("EVIDENCIA VEHÍCULO", 15, vY);
        agregarImagenProporcional(doc, fVehiculo, 15, vY + 5, 180, 38);
    }

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
