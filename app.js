var mapI, mapP, mapZ, markerI, markerP, markerZ;
var gpsIni = "No marcado", gpsFin = "No marcado";
var puntosLevantados = [];
var tipoPuntoActual = "";

// NAVEGACIÓN
function mostrarSubmenu() { ocultarTodo(); document.getElementById('submenu-mantenimiento').style.display = 'block'; }
function volverAlDashboard() { ocultarTodo(); document.getElementById('dashboard').style.display = 'block'; }

function mostrarFormulario(tipo) {
    ocultarTodo();
    if(tipo === 'inspeccion') {
        document.getElementById('form-inspeccion-container').style.display = 'block';
        document.getElementById('id-insp').value = "INSP-" + Math.floor(Math.random()*999999);
        initMapInsp();
    } else if(tipo === 'poda') {
        document.getElementById('form-poda-container').style.display = 'block';
        initMapPoda();
    } else if(tipo === 'zonificacion') {
        document.getElementById('form-zonificacion-container').style.display = 'block';
        initMapZonif();
    }
    window.scrollTo(0,0);
}

function ocultarTodo() {
    const ids = ['dashboard','submenu-mantenimiento','form-inspeccion-container','form-poda-container','form-zonificacion-container'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
}

// CONFIGURACIÓN DE CAPAS
// Capa Satelital para trabajar
const capaSatelite = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'], crossOrigin: 'anonymous'
});

// Capa de Arquitectura/Calles Libre (Wikimedia - Muy amigable para capturas)
const capaCallesLibre = L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
    maxZoom: 19, crossOrigin: 'anonymous'
});

// MAPAS BÁSICOS
function initMapInsp() {
    if (mapI) mapI.remove();
    mapI = L.map('map-insp').setView([14.65, -86.21], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapI);
    markerI = L.marker([14.65, -86.21], {draggable: true}).addTo(mapI);
    setTimeout(() => mapI.invalidateSize(), 300);
}

function initMapPoda() {
    if (mapP) mapP.remove();
    mapP = L.map('map-poda').setView([14.65, -86.21], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapP);
    markerP = L.marker([14.65, -86.21], {draggable: true}).addTo(mapP);
    setTimeout(() => mapP.invalidateSize(), 300);
}

// ZONIFICACIÓN
function initMapZonif() {
    if (mapZ) mapZ.remove();
    mapZ = L.map('map-zonif', { preferCanvas: false }).setView([14.65, -86.21], 16);

    capaSatelite.addTo(mapZ); // Trabajamos en Satélite

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
    puntosLevantados.push(punto);
    dibujarPuntoEnMapa(punto);
    document.getElementById('contador-puntos').innerText = puntosLevantados.length;
    cerrarModal();
}

// DIBUJO CON SVG PARA EVITAR "CUADROS"
function dibujarPuntoEnMapa(p) {
    let color = (p.tipoRed === 'EXISTENTE') ? '#000000' : '#27ae60';
    let svgHtml = "";

    if (p.trafo !== "N/A") {
        // SVG Triángulo real
        svgHtml = `
            <svg width="18" height="18" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <polygon points="50,5 95,95 5,95" fill="${color}" stroke="white" stroke-width="5"/>
            </svg>`;
    } else {
        // SVG Círculo real
        svgHtml = `
            <svg width="14" height="14" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" fill="${color}" stroke="white" stroke-width="8"/>
            </svg>`;
    }

    const icon = L.divIcon({
        className: 'custom-icon',
        html: svgHtml,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });

    L.marker([p.lat, p.lng], { icon: icon }).addTo(mapZ);
}

// GENERAR PPTX
async function generarPowerPoint() {
    let pptx = new PptxGenJS();
    const circuito = document.getElementById('zonif-circuito').value;

    // 1. CAMBIAR A MAPA DE ARQUITECTURA (Wikimedia)
    mapZ.removeLayer(capaSatelite);
    capaCallesLibre.addTo(mapZ);

    // Esperar a que carguen las calles
    await new Promise(r => setTimeout(r, 2000));

    let slidePortada = pptx.addSlide();
    slidePortada.addText(`PLANO TÉCNICO: ${circuito}`, { x:0.5, y:0.4, fontSize:20, bold:true, color:'003366' });

    try {
        const canvas = await html2canvas(document.getElementById('map-zonif'), {
            useCORS: true,
            allowTaint: false,
            scale: 2,
            logging: true
        });
        const imgData = canvas.toDataURL('image/png');
        slidePortada.addImage({ data: imgData, x:0.2, y:1.0, w:9.6, h:4.5 });
    } catch(e) {
        slidePortada.addText("Falla en renderizado de fondo.", { x:1, y:2, color:'red' });
    }

    // REGRESAR A SATÉLITE
    mapZ.removeLayer(capaCallesLibre);
    capaSatelite.addTo(mapZ);

    // 2. DIAPOSITIVAS DE DATOS (6 por hoja)
    for (let i = 0; i < puntosLevantados.length; i += 6) {
        let slide = pptx.addSlide();
        slide.addText(`DATOS DE CAMPO - ${circuito}`, { x:0.5, y:0.2, fontSize:14, bold:true });
        let yPos = 0.7;
        for (let j = i; j < i + 6 && j < puntosLevantados.length; j++) {
            let p = puntosLevantados[j];
            let colorHex = (p.tipoRed === 'EXISTENTE') ? '000000' : '27ae60';
            slide.addText(`Apoyo: ${p.apoyo} (${p.tipoRed})`, { x:0.5, y:yPos, fontSize:10, bold:true, color: colorHex });
            let tableData = [
                ["Poste", "Estructura", "Trafo", "Clientes", "Voltaje"],
                [p.poste, p.estructura, p.trafo, p.clientes, p.voltaje]
            ];
            slide.addTable(tableData, { x:0.5, y:yPos + 0.2, w:9.0, fontSize:8, border:{pt:0.5, color:'CCCCCC'}, fill:'F9F9F9' });
            yPos += 0.85;
        }
    }

    pptx.writeFile({ fileName: `Zonificacion_${circuito}.pptx` });
}
