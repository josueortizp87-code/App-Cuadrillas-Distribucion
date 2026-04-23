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

// CAPAS DE MAPA
const capaSatelite = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'], crossOrigin: true
});

// Usaremos esta capa estándar que suele tener menos restricciones
const capaCallesPlano = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, crossOrigin: true
});

function initMapInsp() {
    if (mapI) mapI.remove();
    mapI = L.map('map-insp').setView([14.65, -86.21], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapI);
    markerI = L.marker([14.65, -86.21], {draggable: true}).addTo(mapI);
}

function initMapPoda() {
    if (mapP) mapP.remove();
    mapP = L.map('map-poda').setView([14.65, -86.21], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapP);
    markerP = L.marker([14.65, -86.21], {draggable: true}).addTo(mapP);
}

// ZONIFICACIÓN
function initMapZonif() {
    if (mapZ) mapZ.remove();
    // Importante: No usar preferCanvas aquí para que html2canvas vea los elementos SVG
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
    puntosLevantados.push(punto);
    dibujarPuntoEnMapa(punto);
    document.getElementById('contador-puntos').innerText = puntosLevantados.length;
    cerrarModal();
}

function dibujarPuntoEnMapa(p) {
    let color = (p.tipoRed === 'EXISTENTE') ? '#000000' : '#27ae60';
    let svgIcon;

    if (p.trafo !== "N/A") {
        // SVG Triángulo puro
        svgIcon = L.divIcon({
            className: 'svg-marker',
            html: `<svg width="20" height="20" viewBox="0 0 100 100"><polygon points="50,5 95,95 5,95" fill="${color}" stroke="white" stroke-width="8"/></svg>`,
            iconSize: [20, 20], iconAnchor: [10, 10]
        });
    } else {
        // SVG Círculo puro
        svgIcon = L.divIcon({
            className: 'svg-marker',
            html: `<svg width="16" height="16" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="${color}" stroke="white" stroke-width="10"/></svg>`,
            iconSize: [16, 16], iconAnchor: [8, 8]
        });
    }
    L.marker([p.lat, p.lng], { icon: svgIcon }).addTo(mapZ);
}

// GENERAR PPTX
async function generarPowerPoint() {
    let pptx = new PptxGenJS();
    const circuito = document.getElementById('zonif-circuito').value;

    // 1. CAMBIO A CAPA DE CALLES
    mapZ.removeLayer(capaSatelite);
    capaCallesPlano.addTo(mapZ);

    // Esperar a que las baldosas del mapa carguen realmente
    await new Promise(resolve => setTimeout(resolve, 2500));

    let slidePortada = pptx.addSlide();
    slidePortada.addText(`PLANO TÉCNICO: ${circuito}`, { x:0.5, y:0.4, fontSize:20, bold:true, color:'003366' });

    try {
        // Configuración agresiva para capturar el fondo
        const canvas = await html2canvas(document.getElementById('map-zonif'), {
            useCORS: true,
            allowTaint: false,
            ignoreElements: (node) => node.classList && node.classList.contains('leaflet-control-container'),
            logging: false,
            scale: 2
        });
        const imgData = canvas.toDataURL('image/png');
        slidePortada.addImage({ data: imgData, x:0.2, y:1.0, w:9.6, h:4.5 });
    } catch(e) {
        slidePortada.addText("Error en captura. Intente desde un navegador en PC.", { x:1, y:2, color:'red' });
    }

    // REGRESAR A MODO TRABAJO
    mapZ.removeLayer(capaCallesPlano);
    capaSatelite.addTo(mapZ);

    // TABLAS DE DATOS
    for (let i = 0; i < puntosLevantados.length; i += 6) {
        let slide = pptx.addSlide();
        slide.addText(`DATOS DE LEVANTAMIENTO - ${circuito}`, { x:0.5, y:0.2, fontSize:14, bold:true });
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
