const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzEXAevasSFIKmHc8LYHV2oObcfU6QeYR38gpzEMpFqkn2DTSb3FHVkXJr19jDTD6ST/exec"; // REEMPLAZA CON TU URL DE DESPLIEGUE

var mapP, markerP;
var gpsIni = "No marcado", gpsFin = "No marcado";

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
            let lat = pos.coords.latitude; let lng = pos.coords.longitude;
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
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = "100%"; img.style.height = "100%";
            img.style.objectFit = "cover";
            contenedor.appendChild(img);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function enviarPodaAGoogle() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const leerFoto = (id) => {
        const file = document.getElementById(id).files[0];
        if (!file) return null;
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    };

    const dibujarMarco = () => { doc.setDrawColor(40); doc.setLineWidth(0.5); doc.rect(5, 5, 200, 287); };

    alert("Generando informe completo y respaldando...");

    // --- PÁGINA 1: DATOS Y GRUPO ---
    dibujarMarco();
    doc.setFontSize(14); doc.text("INFORME DE PODA COMUNITARIA - ENEE", 15, 20);
    doc.setFontSize(9);
    doc.text(`CIRCUITO: ${document.getElementById('poda-circuito').value}`, 15, 30);
    doc.text(`ZONA: ${document.getElementById('poda-zona').value} | FECHA: ${document.getElementById('poda-fecha').value}`, 15, 35);
    doc.text(`TRABAJO: Brecha ${document.getElementById('m-brecha').value}m, Poda ${document.getElementById('m-poda').value}m, Postes ${document.getElementById('m-postes').value}`, 15, 40);
    doc.text(`PAGOS: MO L. ${document.getElementById('pago-mo').value}, Trans L. ${document.getElementById('pago-trans').value}, Personal: ${document.getElementById('poda-personas').value}`, 15, 45);
    doc.text(`RESPONSABLES: ${document.getElementById('resp-super').value} / ${document.getElementById('resp-activ').value}`, 15, 50);
    doc.text(`UBICACIÓN GPS: Inicio ${gpsIni} / Fin ${gpsFin}`, 15, 55);

    const imgGrupo = await leerFoto('f-grupo');
    if(imgGrupo) {
        doc.text("EVIDENCIA DE CUADRILLA:", 15, 65);
        doc.addImage(imgGrupo, 'JPEG', 15, 70, 180, 110);
    }

    // --- PÁGINA 2: DNI ---
    const imgDniF = await leerFoto('f-id-f');
    const imgDniR = await leerFoto('f-id-r');
    if(imgDniF || imgDniR) {
        doc.addPage(); dibujarMarco();
        doc.text("DOCUMENTACIÓN DE IDENTIDAD (DNI)", 15, 20);
        if(imgDniF) { doc.text("FRENTE:", 15, 30); doc.addImage(imgDniF, 'JPEG', 15, 35, 180, 110); }
        if(imgDniR) { doc.text("REVÉS:", 15, 155); doc.addImage(imgDniR, 'JPEG', 15, 160, 180, 110); }
    }

    // --- PÁGINA 3: ANTES, DURANTE, DESPUÉS ---
    doc.addPage(); dibujarMarco();
    doc.text("EVIDENCIAS DEL PROCESO DE PODA", 15, 20);
    const etapas = [
        { t: "ANTES", ids: ['f-ini-1', 'f-ini-2', 'f-ini-3'], y: 30 },
        { t: "DURANTE", ids: ['f-eje-1', 'f-eje-2', 'f-eje-3'], y: 115 },
        { t: "DESPUÉS", ids: ['f-fin-1', 'f-fin-2', 'f-fin-3'], y: 200 }
    ];

    for (let etapa of etapas) {
        doc.text(etapa.t, 15, etapa.y);
        let xPos = 15;
        for (let id of etapa.ids) {
            const img = await leerFoto(id);
            if (img) { doc.addImage(img, 'JPEG', xPos, etapa.y + 5, 58, 75); }
            xPos += 62;
        }
    }

    // --- PÁGINA 4: RECIBO ---
    const imgRecibo = await leerFoto('f-recibo');
    if(imgRecibo) {
        doc.addPage(); dibujarMarco();
        doc.text("RESPALDO DE PAGO (RECIBO)", 15, 20);
        doc.addImage(imgRecibo, 'JPEG', 15, 30, 180, 240);
    }

    // DESCARGAR PDF
    doc.save(`Informe_Poda_${document.getElementById('poda-circuito').value}.pdf`);

    // --- ENVÍO A GOOGLE SHEETS ---
    const datosEnvio = {
        circuito: document.getElementById('poda-circuito').value,
        zona: document.getElementById('poda-zona').value,
        fecha: document.getElementById('poda-fecha').value,
        m_brecha: document.getElementById('m-brecha').value,
        m_poda: document.getElementById('m-poda').value,
        gps: `${gpsIni} | ${gpsFin}`,
        foto: imgGrupo // Enviamos la principal para la celda
    };

    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(datosEnvio)
    }).then(() => alert("✅ Datos enviados a Google Sheets."))
      .catch(e => console.error("Error nube:", e));
}
