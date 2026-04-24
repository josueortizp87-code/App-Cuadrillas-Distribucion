var mapZ, markerZ;
var puntosLevantados = [];
var tipoPuntoActual = "";
var modoDibujo = null;
var puntoOrigenParaLinea = null;

const capaSatelite = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'], crossOrigin: true });
const capaCallesPlano = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, crossOrigin: true });

window.onload = function() { initMapZonif(); };

function initMapZonif() {
    if (mapZ) mapZ.remove();
    mapZ = L.map('map-zonif', { preferCanvas: false }).setView([14.65, -86.21], 16);
    capaSatelite.addTo(mapZ);
    markerZ = L.marker([14.65, -86.21], {draggable: true}).addTo(mapZ);
}

function setModoDibujo(tipo) {
    modoDibujo = tipo;
    puntoOrigenParaLinea = null;
    alert("MODO LÍNEA " + tipo + " ACTIVO\nSeleccione el poste inicial y luego el final.");
}

function abrirModalPunto(tipo) {
    tipoPuntoActual = tipo;
    document.getElementById('modal-punto').style.display = 'flex';
}

function cerrarModalPunto() {
    document.getElementById('modal-punto').style.display = 'none';
    document.getElementById('p-apoyo').value = "";
    document.getElementById('p-clientes').value = "0";
}

function guardarPunto() {
    const coords = markerZ.getLatLng();
    const punto = {
        tipoRed: tipoPuntoActual,
        lat: coords.lat, lng: coords.lng,
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
    cerrarModalPunto();
}

function dibujarPuntoEnMapa(p) {
    let claseIcono = (p.tipoRed === 'EXISTENTE') ? 'icono-poste-existente' : 'icono-poste-proyectado';
    let htmlContent = `<div class="${claseIcono}"></div>`;

    if (p.trafo !== "N/A") {
        let colorTriangulo = (p.tipoRed === 'EXISTENTE') ? '#000000' : '#27ae60';
        htmlContent = `<div class="triangulo-proyectado" style="border-bottom-color: ${colorTriangulo}"></div>`;
    }

    const icon = L.divIcon({ html: htmlContent, className: '', iconSize: [10, 10] });
    const m = L.marker([p.lat, p.lng], { icon: icon }).addTo(mapZ);

    m.on('click', function() {
        if (!modoDibujo) return;
        if (!puntoOrigenParaLinea) {
            puntoOrigenParaLinea = p;
            m.bindTooltip("INICIO", {permanent: true}).openTooltip();
        } else {
            const opciones = {
                color: modoDibujo === 'PROYECTADA' ? '#27ae60' : '#000000',
                weight: 3,
                dashArray: modoDibujo === 'PROYECTADA' ? '5, 10' : null
            };
            L.polyline([[puntoOrigenParaLinea.lat, puntoOrigenParaLinea.lng], [p.lat, p.lng]], opciones).addTo(mapZ);
            mapZ.eachLayer(l => { if(l.getTooltip) l.unbindTooltip(); });
            puntoOrigenParaLinea = null;
        }
    });
}

function latLngToUTM(lat, lng) {
    // Lógica simplificada de conversión UTM Zona 16N
    const x = 500000 + (lng + 87) * 110000;
    const y = lat * 111000;
    return `E:${x.toFixed(0)} N:${y.toFixed(0)}`;
}

async function generarPowerPoint() {
    let pptx = new PptxGenJS();
    const circuito = document.getElementById('zonif-circuito').value;
    const zona = document.getElementById('zonif-area').value || "Sector Sin Nombre";

    mapZ.removeLayer(capaSatelite);
    capaCallesPlano.addTo(mapZ);

    // Esperar a que el mapa cargue las líneas y el plano de calles
    await new Promise(r => setTimeout(r, 4500));

    const canvas = await html2canvas(document.getElementById('map-zonif'), {
        useCORS: true,
        scale: 2,
        onclone: (clonedDoc) => {
            const svgElements = clonedDoc.getElementsByTagName('svg');
            for (let svg of svgElements) { svg.style.display = 'block'; }
        }
    });

    let slidePortada = pptx.addSlide();
    slidePortada.addText(`PLANO TÉCNICO: ${circuito}`, { x:0.5, y:0.3, fontSize:18, bold:true, color:'003366' });
    slidePortada.addImage({ data: canvas.toDataURL('image/png'), x:0.5, y:1.0, w:9, h:4.8 });

    // Tablas de 20 filas por hoja
    for (let i = 0; i < puntosLevantados.length; i += 20) {
        let slide = pptx.addSlide();
        let filasTabla = [[
            { text: "Apoyo", options: { fill: "003366", color: "FFFFFF", bold: true } },
            { text: "UTM (E,N)", options: { fill: "003366", color: "FFFFFF", bold: true } },
            { text: "Poste/Estr.", options: { fill: "003366", color: "FFFFFF", bold: true } },
            { text: "Trafo", options: { fill: "003366", color: "FFFFFF", bold: true } },
            { text: "Cli.", options: { fill: "003366", color: "FFFFFF", bold: true } }
        ]];
        for (let j = i; j < i + 20 && j < puntosLevantados.length; j++) {
            let p = puntosLevantados[j];
            filasTabla.push([p.apoyo, p.utm, `${p.poste}/${p.estructura}`, p.trafo, p.clientes]);
        }
        slide.addTable(filasTabla, { x: 0.3, y: 0.5, w: 9.4, fontSize: 8 });
    }

    pptx.writeFile({ fileName: `Zonificacion_${circuito}.pptx` });
    mapZ.removeLayer(capaCallesPlano);
    capaSatelite.addTo(mapZ);
}
