var mapI, mapP, mapZ, markerI, markerP, markerZ;
var puntosLevantados = [];
var tipoPuntoActual = "";
var lineasRed = []; // Para almacenar las líneas dibujadas

// NAVEGACIÓN
function mostrarSubmenu() { ocultarTodo(); document.getElementById('submenu-mantenimiento').style.display = 'block'; }
function volverAlDashboard() { ocultarTodo(); document.getElementById('dashboard').style.display = 'block'; }

function mostrarFormulario(tipo) {
    ocultarTodo();
    if(tipo === 'zonificacion') {
        document.getElementById('form-zonificacion-container').style.display = 'block';
        initMapZonif();
    }
    // ... otros formularios ...
    window.scrollTo(0,0);
}

function ocultarTodo() {
    const ids = ['dashboard','submenu-mantenimiento','form-zonificacion-container'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
}

// CAPAS DE MAPA
const capaSatelite = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'], crossOrigin: true
});

const capaCallesPlano = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, crossOrigin: true
});

function initMapZonif() {
    if (mapZ) mapZ.remove();
    mapZ = L.map('map-zonif').setView([14.65, -86.21], 16);
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

function abrirModalPunto(tipo) {
    tipoPuntoActual = tipo;
    document.getElementById('modal-punto').style.display = 'block';
    document.getElementById('campos-existente-extra').style.display = (tipo === 'EXISTENTE') ? 'block' : 'none';
}
function cerrarModal() { document.getElementById('modal-punto').style.display = 'none'; }

function guardarPunto() {
    const coords = markerZ.getLatLng();
    const punto = {
        tipoRed: tipoPuntoActual,
        lat: coords.lat, lng: coords.lng,
        apoyo: document.getElementById('p-apoyo').value || "S/N",
        poste: document.getElementById('p-tipo-poste').value,
        estructura: document.getElementById('p-estructura').value || "S/D",
        trafo: document.getElementById('p-trafo').value,
        clientes: document.getElementById('p-clientes').value || "0",
        voltaje: document.getElementById('p-voltaje').value || "N/A"
    };

    // Dibujar línea desde el punto anterior si existe
    if (puntosLevantados.length > 0) {
        dibujarLinea(puntosLevantados[puntosLevantados.length - 1], punto);
    }

    puntosLevantados.push(punto);
    dibujarPuntoEnMapa(punto);
    document.getElementById('contador-puntos').innerText = puntosLevantados.length;
    cerrarModal();
}

function dibujarLinea(puntoA, puntoB) {
    let esProyectado = (puntoB.tipoRed === 'PROYECTADO');
    let opciones = {
        color: esProyectado ? '#27ae60' : '#000000',
        weight: 3,
        dashArray: esProyectado ? '5, 10' : null, // Línea punteada si es proyectado
        opacity: 0.8
    };
    let linea = L.polyline([[puntoA.lat, puntoA.lng], [puntoB.lat, puntoB.lng]], opciones).addTo(mapZ);
    lineasRed.push(linea);
}

function dibujarPuntoEnMapa(p) {
    let color = (p.tipoRed === 'EXISTENTE') ? '#000000' : '#27ae60';
    let etiqueta = `${p.clientes} C`;
    let svgIcon;

    // SVG con etiqueta de texto incluida
    if (p.trafo !== "N/A") {
        svgIcon = L.divIcon({
            className: 'svg-marker',
            html: `<svg width="40" height="40" viewBox="0 0 120 120">
                    <polygon points="60,25 105,115 15,115" fill="${color}" stroke="white" stroke-width="8"/>
                    <text x="65" y="20" font-family="Arial" font-size="28" font-weight="bold" fill="${color}" stroke="white" stroke-width="0.5">${etiqueta}</text>
                   </svg>`,
            iconSize: [40, 40], iconAnchor: [20, 20]
        });
    } else {
        svgIcon = L.divIcon({
            className: 'svg-marker',
            html: `<svg width="40" height="40" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="35" fill="${color}" stroke="white" stroke-width="10"/>
                    <text x="65" y="30" font-family="Arial" font-size="28" font-weight="bold" fill="${color}" stroke="white" stroke-width="0.5">${etiqueta}</text>
                   </svg>`,
            iconSize: [40, 40], iconAnchor: [20, 20]
        });
    }
    L.marker([p.lat, p.lng], { icon: svgIcon }).addTo(mapZ);
}

async function generarPowerPoint() {
    let pptx = new PptxGenJS();
    const circuito = document.getElementById('zonif-circuito').value;

    mapZ.removeLayer(capaSatelite);
    capaCallesPlano.addTo(mapZ);
    await new Promise(resolve => setTimeout(resolve, 2500));

    let slidePortada = pptx.addSlide();
    slidePortada.addText(`PLANO TÉCNICO DE ZONIFICACIÓN: ${circuito}`, { x:0.5, y:0.4, fontSize:18, bold:true, color:'003366' });

    try {
        const canvas = await html2canvas(document.getElementById('map-zonif'), {
            useCORS: true,
            allowTaint: false,
            scale: 2
        });
        const imgData = canvas.toDataURL('image/png');
        slidePortada.addImage({ data: imgData, x:0.2, y:1.0, w:9.6, h:4.5 });
    } catch(e) {
        console.error(e);
    }

    mapZ.removeLayer(capaCallesPlano);
    capaSatelite.addTo(mapZ);

    // Tablas de detalles (6 por diapositiva)
    for (let i = 0; i < puntosLevantados.length; i += 6) {
        let slide = pptx.addSlide();
        slide.addText(`RESUMEN DE APOYOS - ${circuito}`, { x:0.5, y:0.2, fontSize:14, bold:true });
        let yPos = 0.7;
        for (let j = i; j < i + 6 && j < puntosLevantados.length; j++) {
            let p = puntosLevantados[j];
            let colorHex = (p.tipoRed === 'EXISTENTE') ? '000000' : '27ae60';
            slide.addText(`Apoyo: ${p.apoyo} (${p.tipoRed}) - Clientes: ${p.clientes}`, { x:0.5, y:yPos, fontSize:10, bold:true, color: colorHex });
            let tableData = [
                ["Poste", "Estructura", "Trafo", "Voltaje"],
                [p.poste, p.estructura, p.trafo, p.voltaje]
            ];
            slide.addTable(tableData, { x:0.5, y:yPos + 0.2, w:9.0, fontSize:8, border:{pt:0.5, color:'CCCCCC'}, fill:'F9F9F9' });
            yPos += 0.85;
        }
    }

    pptx.writeFile({ fileName: `Zonificacion_${circuito}.pptx` });
}
