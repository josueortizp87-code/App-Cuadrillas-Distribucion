var mapI, mapP, mapZ, markerI, markerP, markerZ;
var gpsIni = "No marcado", gpsFin = "No marcado";
var prioridadSeleccionada = "";
var puntosLevantados = [];
var tipoPuntoActual = "";

// NAVEGACIÓN
function mostrarSubmenu() {
    ocultarTodo();
    document.getElementById('submenu-mantenimiento').style.display = 'block';
}

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

function volverAlDashboard() {
    ocultarTodo();
    document.getElementById('dashboard').style.display = 'block';
}

function ocultarTodo() {
    const ids = ['dashboard','submenu-mantenimiento','form-inspeccion-container','form-poda-container','form-zonificacion-container'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
}

function seleccionarPrioridad(btn, valor) {
    const btns = document.querySelectorAll('.btn-prioridad');
    btns.forEach(b => { b.style.background = '#333'; b.style.color = 'white'; });
    btn.style.background = '#f1c40f';
    btn.style.color = 'black';
    prioridadSeleccionada = valor;
}

// MAPAS (INSPECCIÓN Y PODA)
function initMapInsp() {
    if (mapI) mapI.remove();
    mapI = L.map('map-insp').setView([14.65, -86.21], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapI);
    markerI = L.marker([14.65, -86.21], {draggable: true}).addTo(mapI);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            let lat = pos.coords.latitude, lng = pos.coords.longitude;
            mapI.setView([lat, lng], 17);
            markerI.setLatLng([lat, lng]);
            document.getElementById('txt-coords-insp').innerText = lat.toFixed(6) + ", " + lng.toFixed(6);
        });
    }
    markerI.on('moveend', e => {
        let p = e.target.getLatLng();
        document.getElementById('txt-coords-insp').innerText = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    });
    setTimeout(() => mapI.invalidateSize(), 300);
}

function initMapPoda() {
    if (mapP) mapP.remove();
    mapP = L.map('map-poda').setView([14.65, -86.21], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapP);
    markerP = L.marker([14.65, -86.21], {draggable: true}).addTo(mapP);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            mapP.setView([pos.coords.latitude, pos.coords.longitude], 17);
            markerP.setLatLng([pos.coords.latitude, pos.coords.longitude]);
        });
    }
    setTimeout(() => mapP.invalidateSize(), 300);
}

function marcarGPS(tipo) {
    let p = markerP.getLatLng();
    let c = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    if(tipo === 'ini') gpsIni = c; else gpsFin = c;
    document.getElementById('coords-display').innerText = `Inicio: ${gpsIni} | Fin: ${gpsFin}`;
}

// LÓGICA ZONIFICACIÓN
function initMapZonif() {
    if (mapZ) mapZ.remove();
    mapZ = L.map('map-zonif').setView([14.65, -86.21], 16);
    // CAPA SATELITAL GOOGLE
    L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']
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
    document.getElementById('modal-titulo').innerText = "DETALLE RED " + tipo;
    document.getElementById('campos-existente-extra').style.display = (tipo === 'EXISTENTE') ? 'block' : 'none';
}

function cerrarModal() {
    document.getElementById('modal-punto').style.display = 'none';
}

function guardarPunto() {
    const coords = markerZ.getLatLng();
    const punto = {
        tipoRed: tipoPuntoActual,
        lat: coords.lat, lng: coords.lng,
        apoyo: document.getElementById('p-apoyo').value,
        poste: document.getElementById('p-tipo-poste').value,
        estructura: document.getElementById('p-estructura').value,
        trafo: document.getElementById('p-trafo').value,
        clientes: document.getElementById('p-clientes').value || "0",
        voltaje: document.getElementById('p-voltaje').value || "N/A"
    };
    puntosLevantados.push(punto);
    dibujarPuntoEnMapa(punto);
    actualizarListaPuntosUI();
    cerrarModal();
}

function dibujarPuntoEnMapa(p) {
    let color = (p.tipoRed === 'EXISTENTE') ? 'black' : '#27ae60';
    let htmlContent = "";

    if (p.trafo !== "N/A") {
        // Triángulo
        htmlContent = `<div style="width:0; height:0; border-left:10px solid transparent; border-right:10px solid transparent; border-bottom:18px solid ${color};"></div>`;
    } else {
        // Círculo
        htmlContent = `<div style="width:14px; height:14px; background:${color}; border-radius:50%; border:2px solid white;"></div>`;
    }

    const icon = L.divIcon({ className: 'custom-icon', html: htmlContent, iconSize: [20, 20] });
    L.marker([p.lat, p.lng], {icon: icon}).addTo(mapZ).bindPopup(`Apoyo: ${p.apoyo}`);
}

function actualizarListaPuntosUI() {
    const ul = document.getElementById('ul-puntos');
    ul.innerHTML = puntosLevantados.map(p => `<li>• Apoyo ${p.apoyo} (${p.tipoRed})</li>`).join('');
}

// GENERAR POWERPOINT
function generarPowerPoint() {
    let pptx = new PptxGenJS();
    puntosLevantados.forEach(p => {
        let slide = pptx.addSlide();
        slide.addText(`Levantamiento: Apoyo ${p.apoyo}`, { x: 0.5, y: 0.5, fontSize: 22, bold: true });
        let rows = [
            ["Campo", "Valor"],
            ["Tipo de Red", p.tipoRed],
            ["Tipo de Poste", p.poste],
            ["Estructura", p.estructura],
            ["Transformador", p.trafo],
            ["Clientes", p.clientes],
            ["Voltaje", p.voltaje],
            ["Coordenadas", `${p.lat}, ${p.lng}`]
        ];
        slide.addTable(rows, { x: 0.5, y: 1.2, w: 5.0, fontSize: 12, border: { pt: 1, color: 'CCCCCC' } });
        slide.addText("ING. JOSUÉ ORTIZ - ENEE JUTICALPA", { x: 0.5, y: 5.2, fontSize: 10, color: '666666' });
    });
    pptx.writeFile({ fileName: `Zonificacion_${document.getElementById('zonif-circuito').value}.pptx` });
}

// FUNCIONES AUXILIARES (PREVIEW Y PDF)
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

async function generarPDFPoda() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("INFORME DE PODA - SECTOR JUTICALPA", 15, 20);
    doc.text(`Circuito: ${document.getElementById('poda-circuito').value}`, 15, 30);
    doc.text(`GPS: ${gpsIni} / ${gpsFin}`, 15, 40);
    doc.save("Reporte_Poda.pdf");
}
