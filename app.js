// Inicializar el mapa
var map = L.map('map').setView([14.65, -86.21], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Marcador movible
var marcador = L.marker([14.65, -86.21], {draggable: true}).addTo(map);

marcador.on('dragend', function() {
    var p = marcador.getLatLng();
    document.getElementById('coords').innerText = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
});

function obtenerGPS() {
    navigator.geolocation.getCurrentPosition(pos => {
        var p = [pos.coords.latitude, pos.coords.longitude];
        map.setView(p, 18);
        marcador.setLatLng(p);
        document.getElementById('coords').innerText = p[0].toFixed(6) + ", " + p[1].toFixed(6);
    });
}

function generarReporte() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Reporte de Inspección de Distribución", 10, 10);
    doc.text("Cuadrilla: " + document.getElementById('cuadrilla').value, 10, 20);
    doc.text("Ubicación: " + document.getElementById('coords').innerText, 10, 30);
    doc.text("Notas: " + document.getElementById('obs').value, 10, 40);
    doc.save("reporte-inspeccion.pdf");
}
