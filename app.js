var mapZ, markerZ;
var puntosLevantados = [];
var tipoPuntoActual = "";

// CAPAS DE MAPA
const capaSatelite = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'], crossOrigin: true
});

const capaCallesPlano = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, crossOrigin: true
});

// INICIO AUTOMÁTICO
window.onload = function() {
    initMapZonif();
};

function initMapZonif() {
    if (mapZ) mapZ.remove();
    mapZ = L.map('map-zonif').setView([14.65, -86.21], 16);
    capaSatelite.addTo(mapZ);

    markerZ = L.marker([14.65, -86.21], {draggable: true}).addTo(mapZ);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            mapZ.setView([lat, lng], 18);
            markerZ.setLatLng([lat, lng]);
        }, () => {
            console.log("No se pudo obtener ubicación real, usando por defecto.");
        });
    }
}

function abrirModalPunto(tipo) {
    tipoPuntoActual = tipo;
    document.getElementById('modal-punto').style.display = 'block';
    // Limpiar campos para nuevo registro
    document.getElementById('p-apoyo').value = "";
    document.getElementById('p-estructura').value = "";
}

function cerrarModal() {
    document.getElementById('modal-punto').style.display = 'none';
}

function guardarPunto() {
    const coords = markerZ.getLatLng();
    const punto = {
        tipoRed: tipoPuntoActual,
        lat: coords.lat,
        lng: coords.lng,
        apoyo: document.getElementById('p-apoyo').value || "S/N",
        poste: document.getElementById('p-tipo-poste').value,
        estructura: document.getElementById('p-estructura').value || "S/D",
        trafo: document.getElementById('p-trafo').value,
        clientes: document.getElementById('p-clientes').value || "0",
        voltaje: document.getElementById('p-voltaje').value || "N/A"
    };

    puntosLevantados.push(punto);
    dibujarPuntoEnMapa(punto);
    actualizarListaVisual();

    document.getElementById('contador-puntos').innerText = puntosLevantados.length;
    cerrarModal();
}

function dibujarPuntoEnMapa(p) {
    let color = (p.tipoRed === 'EXISTENTE') ? '#000000' : '#27ae60';
    let svgIcon;

    if (p.trafo !== "N/A") {
        svgIcon = L.divIcon({
            className: 'svg-marker',
            html: `<svg width="24" height="24" viewBox="0 0 100 100"><polygon points="50,5 95,95 5,95" fill="${color}" stroke="white" stroke-width="8"/></svg>`,
            iconSize: [24, 24], iconAnchor: [12, 12]
        });
    } else {
        svgIcon = L.divIcon({
            className: 'svg-marker',
            html: `<svg width="18" height="18" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="${color}" stroke="white" stroke-width="10"/></svg>`,
            iconSize: [18, 18], iconAnchor: [9, 9]
        });
    }
    L.marker([p.lat, p.lng], { icon: svgIcon }).addTo(mapZ).bindPopup(`Apoyo: ${p.apoyo}`);
}

function actualizarListaVisual() {
    const ul = document.getElementById('ul-puntos');
    ul.innerHTML = "";
    puntosLevantados.slice(-5).reverse().forEach(p => {
        const li = document.createElement('li');
        li.style.marginBottom = "5px";
        li.innerHTML = `<i class="fas fa-check-circle" style="color:${p.tipoRed === 'EXISTENTE' ? '#aaa' : '#27ae60'}"></i> ${p.apoyo} - ${p.poste}`;
        ul.appendChild(li);
    });
}

async function generarPowerPoint() {
    if (puntosLevantados.length === 0) {
        alert("Primero debe levantar puntos en el mapa.");
        return;
    }

    let pptx = new PptxGenJS();
    const circuito = document.getElementById('zonif-circuito').value;

    mapZ.removeLayer(capaSatelite);
    capaCallesPlano.addTo(mapZ);

    await new Promise(resolve => setTimeout(resolve, 2000));

    let slidePortada = pptx.addSlide();
    slidePortada.addText(`PLANO TÉCNICO DE ZONIFICACIÓN\n${circuito}`, { x:0.5, y:0.4, w:9, fontSize:22, bold:true, color:'003366', align:'center' });

    try {
        const canvas = await html2canvas(document.getElementById('map-zonif'), {
            useCORS: true,
            scale: 2
        });
        const imgData = canvas.toDataURL('image/png');
        slidePortada.addImage({ data: imgData, x:0.5, y:1.2, w:9, h:4.2 });
    } catch(e) {
        console.error("Error capturando mapa:", e);
    }

    mapZ.removeLayer(capaCallesPlano);
    capaSatelite.addTo(mapZ);

    for (let i = 0; i < puntosLevantados.length; i += 6) {
        let slide = pptx.addSlide();
        slide.addText(`DETALLE DE LEVANTAMIENTO - ${circuito}`, { x:0.5, y:0.2, fontSize:14, bold:true });
        let yPos = 0.7;
        for (let j = i; j < i + 6 && j < puntosLevantados.length; j++) {
            let p = puntosLevantados[j];
            let colorHex = (p.tipoRed === 'EXISTENTE') ? '333333' : '27ae60';
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
