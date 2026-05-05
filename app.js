var mapP, markerP;
var gpsIni = "No marcado", gpsFin = "No marcado";

window.onload = function() {
    initMapPoda();
};

// MAPA PODA
function initMapPoda() {
    if (mapP) mapP.remove();

    mapP = L.map('map-poda').setView([14.65, -86.21], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(mapP);

    markerP = L.marker([14.65, -86.21], { draggable: true }).addTo(mapP);

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

// GPS
function marcarGPS(tipo) {
    let p = markerP.getLatLng();
    let c = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);

    if (tipo === 'ini') gpsIni = c;
    else gpsFin = c;

    document.getElementById('coords-display').innerText =
        `Inicio: ${gpsIni} | Fin: ${gpsFin}`;
}

// PDF
async function generarPDFPoda() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("INFORME DE PODA COMUNITARIA", 15, 20);

    doc.setFontSize(9);
    doc.text(`CIRCUITO: ${document.getElementById('poda-circuito').value}`, 15, 30);
    doc.text(`ZONA: ${document.getElementById('poda-zona').value}`, 15, 35);
    doc.text(`FECHA: ${document.getElementById('poda-fecha').value}`, 15, 40);
    doc.text(`GPS: ${gpsIni} / ${gpsFin}`, 15, 45);

    doc.save("Informe_Poda.pdf");
}

// PREVISUALIZACIÓN
function previsualizar(input, idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.innerHTML = "";

    if (input.files && input.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
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
