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

// CONFIGURACIÓN DE CAPAS DE MAPA
const capaSatelite = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'], crossOrigin: true
});

const capaCallesPlano = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19, crossOrigin: true
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

// ZONIFICACIÓN: EL MAPA INTELIGENTE
function initMapZonif() {
    if (mapZ) mapZ.remove();
    mapZ = L.map('map-zonif', { preferCanvas: true }).setView([14.65, -86.21], 16);

    // Iniciamos con Satélite para que Josué trabaje con detalle
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
    let marker;
    if (p.trafo !== "N/A") {
        const trafoIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:${color}; width:12px; height:12px; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); border:1px solid white;"></div>`,
            iconSize: [12, 12], iconAnchor: [6, 6]
        });
        marker = L.marker([p.lat, p.lng], { icon: trafoIcon });
    } else {
        marker = L.circleMarker([p.lat, p.lng], {
            radius: 6, fillColor: color, color: "#ffffff", weight: 2, opacity: 1, fillOpacity: 1
        });
    }
    marker.addTo(mapZ);
}

// GENERAR PPTX (CAMBIO DE CAPA EN TIEMPO REAL)
async function generarPowerPoint() {
    let pptx = new PptxGenJS();
    const circuito = document.getElementById('zonif-circuito').value;

    // --- PASO 1: CAMBIO A MODO PLANO ---
    mapZ.removeLayer(capaSatelite);
    capaCallesPlano.addTo(mapZ);

    // Esperamos un segundo a que las calles carguen
    await new Promise(resolve => setTimeout(resolve, 1200));

    // --- PASO 2: CAPTURA DEL PLANO ---
    let slidePortada = pptx.addSlide();
    slidePortada.addText(`PLANO DE LEVANTAMIENTO: ${circuito}`, { x:0.5, y:0.4, fontSize:20, bold:true, color:'003366' });

    try {
        const canvas = await html2canvas(document.getElementById('map-zonif'), {
            useCORS: true,
            allowTaint: false,
            scale: 2
        });
        const imgData = canvas.toDataURL('image/png');
        slidePortada.addImage({ data: imgData, x:0.5, y:1.0, w:9.0, h:4.5 });
    } catch(e) {
        slidePortada.addText("Error en captura de calles.", { x:1, y:2, color:'red' });
    }

    // --- PASO 3: REGRESAR A MODO SATÉLITE ---
    mapZ.removeLayer(capaCallesPlano);
    capaSatelite.addTo(mapZ);

    // --- PASO 4: GENERAR TABLAS (6 POR HOJA) ---
    for (let i = 0; i < puntosLevantados.length; i += 6) {
        let slide = pptx.addSlide();
        slide.addText(`DETALLE TÉCNICO - APOYOS (${i+1} al ${Math.min(i+6, puntosLevantados.length)})`, { x:0.5, y:0.2, fontSize:14, bold:true });
        let yPos = 0.7;
        for (let j = i; j < i + 6 && j < puntosLevantados.length; j++) {
            let p = puntosLevantados[j];
            let colorHex = (p.tipoRed === 'EXISTENTE') ? '333333' : '27ae60';
            slide.addText(`Apoyo: ${p.apoyo} [${p.tipoRed}]`, { x:0.5, y:yPos, fontSize:11, bold:true, color: colorHex });
            let tableData = [
                ["Poste", "Estructura", "Trafo", "Clientes", "Voltaje"],
                [p.poste, p.estructura, p.trafo, p.clientes, p.voltaje]
            ];
            slide.addTable(tableData, { x:0.5, y:yPos + 0.25, w:9.0, rowH:0.2, fontSize:9, border:{pt:0.5, color:'CCCCCC'}, fill:'FDFDFD' });
            yPos += 0.85;
        }
    }

    pptx.writeFile({ fileName: `Levantamiento_${circuito}.pptx` });
}
