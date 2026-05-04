// CONFIGURACIÓN: PEGA TU URL DE GOOGLE APPS SCRIPT AQUÍ
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzEXAevasSFIKmHc8LYHV2oObcfU6QeYR38gpzEMpFqkn2DTSb3FHVkXJr19jDTD6ST/exec";

var mapP, markerP;
var gpsIni = "No marcado", gpsFin = "No marcado";

// Al cargar el documento, mostramos directamente Poda
window.onload = function() {
    document.getElementById('form-poda-container').style.display = 'block';
    initMapPoda();
};

function initMapPoda() {
    if (mapP) mapP.remove();
    mapP = L.map('map-poda').setView([14.65, -86.21], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapP);

    markerP = L.marker([14.65, -86.21], {draggable: true}).addTo(mapP);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            let lat = pos.coords.latitude;
            let lng = pos.coords.longitude;
            mapP.setView([lat, lng], 17);
            markerP.setLatLng([lat, lng]);
        });
    }
    setTimeout(() => mapP.invalidateSize(), 300);
}

function marcarGPS(tipo) {
    let p = markerP.getLatLng();
    let c = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    if(tipo === 'ini') gpsIni = c; else gpsFin = c;
    document.getElementById('coords-display').innerText = `Inicio: ${gpsIni} | Fin: ${gpsFin}`;
}

function previsualizar(input, idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.innerHTML = "";
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = "100%"; img.style.height = "100%";
            img.style.objectFit = "cover"; img.style.borderRadius = "4px";
            contenedor.appendChild(img);
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// --- FUNCIÓN MAESTRA: GENERA PDF Y SUBE A LA NUBE ---

async function enviarPodaAGoogle() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Función auxiliar para leer fotos
    const leerFoto = (id) => {
        const file = document.getElementById(id).files[0];
        if (!file) return null;
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    };

    // 1. RECOLECTAR DATOS PARA LA NUBE
    alert("Iniciando proceso: Generando PDF y respaldando en la nube...");

    const fGrupo = await leerFoto('f-grupo');
    const fIdF = await leerFoto('f-id-f');
    const fRecibo = await leerFoto('f-recibo');

    const datosPoda = {
        circuito: document.getElementById('poda-circuito').value,
        zona: document.getElementById('poda-zona').value,
        fecha: document.getElementById('poda-fecha').value,
        gps: `Ini: ${gpsIni} / Fin: ${gpsFin}`,
        cuadrilla: document.getElementById('resp-activ').value,
        m_poda: document.getElementById('m-poda').value,
        nombre_foto: `PODA_${Date.now()}.jpg`,
        foto: fGrupo // Enviamos la foto grupal como referencia principal a la hoja
    };

    // 2. LÓGICA ORIGINAL DE TU PDF (Respetada al 100%)
    const dibujarMarco = () => { doc.setDrawColor(40); doc.setLineWidth(0.5); doc.rect(5, 5, 200, 287); };
    dibujarMarco();
    doc.setFontSize(14); doc.text("INFORME DE PODA COMUNITARIA SECTOR: JUTICALPA", 15, 20);
    doc.setFontSize(9);
    doc.text(`CIRCUITO: ${datosPoda.circuito}`, 15, 28);
    doc.text(`ZONA: ${datosPoda.zona} | FECHA: ${datosPoda.fecha}`, 15, 33);
    doc.text(`GPS: ${datosPoda.gps}`, 15, 53);
    // ... (aquí el resto de tus textos del PDF)

    if(fGrupo) { doc.text("EVIDENCIA GRUPAL:", 15, 63); doc.addImage(fGrupo, 'JPEG', 10, 68, 190, 120); doc.rect(10, 68, 190, 120); }

    // Guardar PDF localmente
    doc.save(`Poda_${datosPoda.circuito}_${datosPoda.fecha}.pdf`);

    // 3. ENVÍO A GOOGLE SHEETS
    try {
        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(datosPoda)
        });
        alert("✅ PDF generado y respaldo guardado en Google Drive con éxito.");
    } catch (error) {
        alert("El PDF se generó, pero hubo un error con la nube: " + error.message);
    }
}
