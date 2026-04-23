var mapI, mapP, mapZ, markerI, markerP, markerZ;
var puntosLevantados = [];
var lineasRed = [];

// ... (Funciones de navegación se mantienen igual) ...

function initMapZonif() {
    if (mapZ) mapZ.remove();
    // Agregamos preferCanvas: true para que las líneas sean capturables fácilmente
    mapZ = L.map('map-zonif', { preferCanvas: true }).setView([14.65, -86.21], 16);
    capaSatelite.addTo(mapZ);

    markerZ = L.marker([14.65, -86.21], {draggable: true}).addTo(mapZ);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            mapZ.setView([pos.coords.latitude, pos.coords.longitude], 18);
            markerZ.setLatLng([pos.coords.latitude, pos.coords.longitude]);
        });
    }
    setTimeout(() => mapZ.invalidateSize(), 300);
}

function guardarPunto() {
    const coords = markerZ.getLatLng();
    const punto = {
        tipoRed: tipoPuntoActual, // "EXISTENTE" o "PROYECTADA"
        lat: coords.lat, lng: coords.lng,
        apoyo: document.getElementById('p-apoyo').value || "S/N",
        poste: document.getElementById('p-tipo-poste').value,
        estructura: document.getElementById('p-estructura').value || "S/D",
        trafo: document.getElementById('p-trafo').value,
        clientes: document.getElementById('p-clientes').value || "0",
        voltaje: document.getElementById('p-voltaje').value || "N/A"
    };

    // Unir con el punto anterior
    if (puntosLevantados.length > 0) {
        dibujarLinea(puntosLevantados[puntosLevantados.length - 1], punto);
    }

    puntosLevantados.push(punto);
    dibujarPuntoEnMapa(punto);
    document.getElementById('contador-puntos').innerText = puntosLevantados.length;
    cerrarModal();
}

function dibujarLinea(puntoA, puntoB) {
    // Si el punto de llegada es PROYECTADA, la línea debe ser verde y segmentada
    let esProyectada = (puntoB.tipoRed === 'PROYECTADA');

    let opciones = {
        color: esProyectada ? '#27ae60' : '#000000',
        weight: 4,
        dashArray: esProyectada ? '10, 15' : null, // Segmentada para proyectada
        opacity: 0.9,
        lineJoin: 'round'
    };

    let linea = L.polyline([[puntoA.lat, puntoA.lng], [puntoB.lat, puntoB.lng]], opciones).addTo(mapZ);
    lineasRed.push(linea);
}

function dibujarPuntoEnMapa(p) {
    let color = (p.tipoRed === 'EXISTENTE') ? '#000000' : '#27ae60';
    let etiqueta = `${p.clientes} C`;

    let svgHtml = p.trafo !== "N/A" ?
        `<svg width="45" height="45" viewBox="0 0 120 120">
            <polygon points="60,30 105,110 15,110" fill="${color}" stroke="white" stroke-width="8"/>
            <text x="60" y="25" font-family="Arial" font-size="28" font-weight="bold" fill="${color}" text-anchor="middle" stroke="white" stroke-width="0.8" paint-order="stroke">${etiqueta}</text>
        </svg>` :
        `<svg width="45" height="45" viewBox="0 0 120 120">
            <circle cx="60" cy="70" r="35" fill="${color}" stroke="white" stroke-width="10"/>
            <text x="60" y="30" font-family="Arial" font-size="28" font-weight="bold" fill="${color}" text-anchor="middle" stroke="white" stroke-width="0.8" paint-order="stroke">${etiqueta}</text>
        </svg>`;

    const icon = L.divIcon({
        className: 'svg-marker',
        html: svgHtml,
        iconSize: [45, 45],
        iconAnchor: [22, 22]
    });

    L.marker([p.lat, p.lng], { icon: icon }).addTo(mapZ);
}

async function generarPowerPoint() {
    let pptx = new PptxGenJS();
    const circuito = document.getElementById('zonif-circuito').value;

    // Cambiar a vista de plano para la captura
    mapZ.removeLayer(capaSatelite);
    capaCallesPlano.addTo(mapZ);

    // Espera crítica para que el Canvas se actualice con las líneas
    await new Promise(resolve => setTimeout(resolve, 3000));

    let slidePortada = pptx.addSlide();
    slidePortada.addText(`PLANO TÉCNICO DE ZONIFICACIÓN: ${circuito}`, { x:0.5, y:0.3, fontSize:18, bold:true, color:'003366' });

    try {
        const canvas = await html2canvas(document.getElementById('map-zonif'), {
            useCORS: true,
            allowTaint: false,
            scale: 2,
            backgroundColor: null
        });
        const imgData = canvas.toDataURL('image/png');
        slidePortada.addImage({ data: imgData, x:0.2, y:0.8, w:9.6, h:4.8 });
    } catch(e) {
        console.error("Error capturando mapa:", e);
    }

    // Regresar a vista satelital para seguir trabajando
    mapZ.removeLayer(capaCallesPlano);
    capaSatelite.addTo(mapZ);

    // Generar tablas de datos... (el resto del código se mantiene igual)
    // ...
    pptx.writeFile({ fileName: `Zonificacion_${circuito}.pptx` });
}
