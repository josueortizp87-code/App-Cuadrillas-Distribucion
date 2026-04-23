var mapI, mapP, mapZ, markerI, markerP, markerZ;
var gpsIni = "No marcado", gpsFin = "No marcado";
var prioridadSeleccionada = "";
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

// MAPAS BÁSICOS
function initMapInsp() {
    if (mapI) mapI.remove();
    mapI = L.map('map-insp').setView([14.65, -86.21], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapI);
    markerI = L.marker([14.65, -86.21], {draggable: true}).addTo(mapI);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            mapI.setView([pos.coords.latitude, pos.coords.longitude], 17);
            markerI.setLatLng([pos.coords.latitude, pos.coords.longitude]);
        });
    }
    setTimeout(() => mapI.invalidateSize(), 300);
}

function initMapPoda() {
    if (mapP) mapP.remove();
    mapP = L.map('map-poda').setView([14.65, -86.21], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapP);
    markerP = L.marker([14.65, -86.21], {draggable: true}).addTo(mapP);
    setTimeout(() => mapP.invalidateSize(), 300);
}

function marcarGPS(tipo) {
    let p = markerP.getLatLng();
    let c = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    if(tipo === 'ini') gpsIni = c; else gpsFin = c;
    document.getElementById('coords-display').innerText = `Inicio: ${gpsIni} | Fin: ${gpsFin}`;
}

// ZONIFICACIÓN: CONFIGURACIÓN PARA CAPTURA DE PLANO
function initMapZonif() {
    if (mapZ) mapZ.remove();

    // preferCanvas: true es vital para que la captura sea fiel
    mapZ = L.map('map-zonif', { preferCanvas: true }).setView([14.65, -86.21], 16);

    // Usamos una capa que permite crossOrigin para que las calles NO salgan en blanco
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap',
        crossOrigin: true // PERMITE QUE HTML2CANVAS LEA LAS IMÁGENES
    }).addTo(mapZ);

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
    // Dibujamos usando CircleMarker para que sea parte del Canvas (mejor para el PPTX)
    if (p.trafo !== "N/A") {
        // Marcador especial para Trafo (Triángulo manual en Leaflet)
        const trafoIcon = L.divIcon({
            className: 'trafo-icon',
            html: `<div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:16px solid ${color};"></div>`,
            iconSize: [16, 16]
        });
        L.marker([p.lat, p.lng], { icon: trafoIcon }).addTo(mapZ);
    } else {
        L.circleMarker([p.lat, p.lng], {
            radius: 7,
            fillColor: color,
            color: "#ffffff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(mapZ);
    }
}

// GENERAR PPTX MEJORADO
async function generarPowerPoint() {
    let pptx = new PptxGenJS();
    const circuito = document.getElementById('zonif-circuito').value;

    // 1. Slide de Plano (Captura con Calles)
    let slidePortada = pptx.addSlide();
    slidePortada.addText(`PLANO DE LEVANTAMIENTO: ${circuito}`, { x:0.5, y:0.4, fontSize:20, bold:true, color:'003366' });

    try {
        // useCORS: true es el comando clave aquí
        const canvas = await html2canvas(document.getElementById('map-zonif'), {
            useCORS: true,
            allowTaint: false,
            logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        slidePortada.addImage({ data: imgData, x:0.5, y:1.0, w:9.0, h:4.5 });
    } catch(e) {
        slidePortada.addText("Error al capturar calles. Verifique conexión.", { x:1, y:2, color:'CC0000' });
    }

    // 2. Slides de Datos (6 por página)
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

            slide.addTable(tableData, {
                x:0.5, y:yPos + 0.25, w:9.0, rowH:0.2,
                fontSize:9, border:{pt:0.5, color:'CCCCCC'},
                fill:'FDFDFD'
            });

            yPos += 0.85;
        }
    }

    pptx.writeFile({ fileName: `Levantamiento_${circuito}.pptx` });
}

function previsualizar(input, idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.innerHTML = "";
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = "100%"; img.style.height = "100%"; img.style.objectFit = "cover";
            contenedor.appendChild(img);
        };
        reader.readAsDataURL(input.files[0]);
    }
}
