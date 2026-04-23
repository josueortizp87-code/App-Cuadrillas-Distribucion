var mapI, mapP, mapZ, markerI, markerP, markerZ;
var puntosLevantados = [];
var lineasRed = [];
var puntoOrigenParaLinea = null;
var modoDibujo = null; // "EXISTENTE" o "PROYECTADA"

// --- NAVEGACIÓN Y CONFIGURACIÓN ---
function mostrarFormulario(tipo) {
    ocultarTodo();
    if(tipo === 'zonificacion') {
        document.getElementById('form-zonificacion-container').style.display = 'block';
        initMapZonif();
    }
    window.scrollTo(0,0);
}

function ocultarTodo() {
    const ids = ['dashboard','submenu-mantenimiento','form-zonificacion-container'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
}

// CAPAS
const capaSatelite = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'], crossOrigin: true
});
const capaCallesPlano = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, crossOrigin: true
});

function initMapZonif() {
    if (mapZ) mapZ.remove();
    mapZ = L.map('map-zonif', { preferCanvas: true }).setView([14.65, -86.21], 16);
    capaSatelite.addTo(mapZ);

    markerZ = L.marker([14.65, -86.21], {draggable: true}).addTo(mapZ);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            mapZ.setView([pos.coords.latitude, pos.coords.longitude], 18);
            markerZ.setLatLng([pos.coords.latitude, pos.coords.longitude]);
        });
    }
}

// --- LÓGICA DE PUNTOS ---
function guardarPunto() {
    const coords = markerZ.getLatLng();
    const punto = {
        id: Date.now(),
        tipoRed: tipoPuntoActual,
        lat: coords.lat,
        lng: coords.lng,
        utm: latLngToUTM(coords.lat, coords.lng),
        apoyo: document.getElementById('p-apoyo').value || "S/N",
        poste: document.getElementById('p-tipo-poste').value,
        estructura: document.getElementById('p-estructura').value || "S/D",
        trafo: document.getElementById('p-trafo').value,
        clientes: document.getElementById('p-clientes').value || "0",
        voltaje: document.getElementById('p-voltaje').value || "N/A"
    };

    puntosLevantados.push(punto);
    dibujarPuntoEnMapa(punto);
    document.getElementById('contador-puntos').innerText = puntosLevantados.length;
    cerrarModal();
}

function dibujarPuntoEnMapa(p) {
    let color = (p.tipoRed === 'EXISTENTE') ? '#000000' : '#27ae60';
    let etiqueta = `${p.clientes} C`;

    // Tamaño reducido al 50% (aprox 22px)
    let svgHtml = p.trafo !== "N/A" ?
        `<svg width="25" height="25" viewBox="0 0 100 100">
            <polygon points="50,25 90,90 10,90" fill="${color}" stroke="white" stroke-width="5"/>
            <text x="50" y="20" font-family="Arial" font-size="24" font-weight="bold" fill="${color}" text-anchor="middle" stroke="white" stroke-width="3" paint-order="stroke">${etiqueta}</text>
        </svg>` :
        `<svg width="25" height="25" viewBox="0 0 100 100">
            <circle cx="50" cy="65" r="30" fill="${color}" stroke="white" stroke-width="6"/>
            <text x="50" y="30" font-family="Arial" font-size="24" font-weight="bold" fill="${color}" text-anchor="middle" stroke="white" stroke-width="3" paint-order="stroke">${etiqueta}</text>
        </svg>`;

    const icon = L.divIcon({ className: 'svg-marker', html: svgHtml, iconSize: [25, 25], iconAnchor: [12, 12] });

    let m = L.marker([p.lat, p.lng], { icon: icon }).addTo(mapZ);

    // Al hacer clic en un punto, si hay modo dibujo activo, traza línea
    m.on('click', () => {
        if (!modoDibujo) return;
        if (!puntoOrigenParaLinea) {
            puntoOrigenParaLinea = p;
            alert("Origen seleccionado. Haz clic en el siguiente punto.");
        } else {
            trazarLineaManual(puntoOrigenParaLinea, p, modoDibujo);
            puntoOrigenParaLinea = null;
        }
    });
}

// --- LÓGICA DE LÍNEAS MANUALES ---
function setModoDibujo(tipo) {
    modoDibujo = tipo;
    puntoOrigenParaLinea = null;
    alert("Modo: Dibujar Línea " + tipo + ". Toca dos puntos para unirlos.");
}

function trazarLineaManual(pA, pB, tipo) {
    let esProy = (tipo === 'PROYECTADA');
    let opciones = {
        color: esProy ? '#27ae60' : '#000000',
        weight: 3,
        dashArray: esProy ? '8, 12' : null,
        opacity: 0.8
    };
    L.polyline([[pA.lat, pA.lng], [pB.lat, pB.lng]], opciones).addTo(mapZ);
}

// Conversión simple a UTM Zona 16 (Honduras)
function latLngToUTM(lat, lng) {
    const zone = 16;
    const sa = 6378137.0;
    const e = 0.081819191;
    const e2 = e * e;
    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;
    const lngOrigin = (zone * 6 - 183) * Math.PI / 180;
    const n = sa / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
    const t = Math.tan(latRad) * Math.tan(latRad);
    const c = e2 * Math.cos(latRad) * Math.cos(latRad) / (1 - e2);
    const a = (lngRad - lngOrigin) * Math.cos(latRad);
    const m = sa * ( (1 - e2/4 - 3*e2*e2/64) * latRad - (3*e2/8 + 3*e2*e2/32) * Math.sin(2*latRad) + (15*e2*e2/256) * Math.sin(4*latRad) );
    const x = 500000 + 0.9996 * n * (a + (1-t+c)*a*a*a/6 + (5-18*t+t*t+72*c-58*e2)*a*a*a*a*a/120);
    const y = 0.9996 * (m + n * Math.tan(latRad) * (a*a/2 + (5-t+9*c+4*c*c)*a*a*a*a/24 + (61-58*t+t*t+600*c-330*e2)*a*a*a*a*a*a/720));
    return `E: ${x.toFixed(0)} N: ${y.toFixed(0)}`;
}

async function generarPowerPoint() {
    let pptx = new PptxGenJS();
    const circ = document.getElementById('zonif-circuito').value;

    mapZ.removeLayer(capaSatelite);
    capaCallesPlano.addTo(mapZ);
    await new Promise(r => setTimeout(r, 3000));

    let slide1 = pptx.addSlide();
    slide1.addText(`PLANO TÉCNICO: ${circ}`, { x:0.5, y:0.3, fontSize:18, bold:true });

    try {
        const canvas = await html2canvas(document.getElementById('map-zonif'), { useCORS: true, scale: 2 });
        slide1.addImage({ data: canvas.toDataURL('png'), x:0.2, y:0.8, w:9.6, h:4.8 });
    } catch(e) { console.error(e); }

    mapZ.removeLayer(capaCallesPlano);
    capaSatelite.addTo(mapZ);

    // RESUMEN CON COORDENADAS
    for (let i = 0; i < puntosLevantados.length; i += 4) {
        let slide = pptx.addSlide();
        slide.addText(`DETALLE DE APOYOS - ${circ}`, { x:0.5, y:0.2, fontSize:14, bold:true });
        let yPos = 0.6;
        for (let j = i; j < i + 4 && j < puntosLevantados.length; j++) {
            let p = puntosLevantados[j];
            slide.addText(`Apoyo: ${p.apoyo} | UTM: ${p.utm} | GD: ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`, { x:0.5, y:yPos, fontSize:9, bold:true, color:'333333' });
            let tableData = [
                ["Poste", "Estructura", "Trafo", "Clientes", "Voltaje"],
                [p.poste, p.estructura, p.trafo, p.clientes, p.voltaje]
            ];
            slide.addTable(tableData, { x:0.5, y:yPos + 0.2, w:9.0, fontSize:8, border:{pt:0.5, color:'CCCCCC'} });
            yPos += 1.2;
        }
    }
    pptx.writeFile({ fileName: `Zonificacion_${circ}.pptx` });
}
