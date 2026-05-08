var mapP, markerP;
var gpsIni = "No marcado", gpsFin = "No marcado";
var latIni = null, lngIni = null;
var latFin = null, lngFin = null;
var sectorActivo = "";
 
// CREDENCIALES
const USUARIOS = {
    "admin": "admin123",
    "brus laguna": "enee2026",
    "choluteca": "enee2026",
    "comayagua": "enee2026",
    "danli": "enee2026",
    "el progreso": "enee2026",
    "juticalpa": "enee2026",
    "la ceiba": "enee2026",
    "san pedro sula": "enee2026",
    "santa barbara": "enee2026",
    "santa rosa": "enee2026",
    "santa cruz": "enee2026",
    "tegucigalpa": "enee2026",
    "tocoa": "enee2026"
};
 
function validarLogin() {
    const u = document.getElementById('user').value.toLowerCase();
    const p = document.getElementById('pass').value;
 
    if (USUARIOS[u] && USUARIOS[u] === p) {
        sectorActivo = u.toUpperCase();
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('form-poda-container').style.display = 'block';
        document.getElementById('user-display').innerText = "Sector: " + sectorActivo;
        initMapPoda();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}
 
function initMapPoda() {
    if (mapP) mapP.remove();
    mapP = L.map('map-poda').setView([14.65, -86.21], 15);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    }).addTo(mapP);
    markerP = L.marker([14.65, -86.21], { draggable: true }).addTo(mapP);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            let lat = pos.coords.latitude;
            let lng = pos.coords.longitude;
            actualizarMarcador(lat, lng);
        }, () => {}, {enableHighAccuracy: true});
    }
    setTimeout(() => mapP.invalidateSize(), 300);
}
 
function actualizarMarcador(lat, lng) {
    mapP.setView([lat, lng], 17);
    markerP.setLatLng([lat, lng]);
}
 
function ingresarManual() {
    const lat = parseFloat(document.getElementById('manual-lat').value);
    const lng = parseFloat(document.getElementById('manual-lng').value);
    if (!isNaN(lat) && !isNaN(lng)) {
        actualizarMarcador(lat, lng);
    } else {
        alert("Ingrese coordenadas válidas");
    }
}
 
function marcarGPS(tipo) {
    let p = markerP.getLatLng();
    let lat = Number(p.lat.toFixed(6));
    let lng = Number(p.lng.toFixed(6));
    let c = lat + ", " + lng;
    if (tipo === 'ini') { gpsIni = c; latIni = lat; lngIni = lng; } 
    else { gpsFin = c; latFin = lat; lngFin = lng; }
    document.getElementById('coords-display').innerText = `Inicio: ${gpsIni} | Fin: ${gpsFin}`;
}
 
async function generarPDFPoda() {
    try { enviarDatosCloudflare(); } catch(e) {}

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Función para dibujar el cajetín técnico
    const dibujarCajetinSencillo = (yOffset) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);

        // --- ENCABEZADO ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("ENEE", 15, yOffset + 15); // Logo de texto
        
        doc.setFontSize(10);
        doc.text("EMPRESA NACIONAL DE ENERGÍA ELÉCTRICA", 65, yOffset + 10);
        doc.text("INFORME DE PODA COMUNITARIA", 65, yOffset + 17);
        doc.text("SECTOR: " + sectorActivo, 65, yOffset + 24);
        
        // Línea divisoria debajo del encabezado
        doc.line(10, yOffset + 30, 200, yOffset + 30);

        // --- TABLA DE DATOS DEL SITIO ---
        let currentY = yOffset + 35;
        const lineH = 7; // Altura de fila

        const drawRow = (label, value, xPos, width, isBold = false) => {
            doc.setFont("helvetica", "bold");
            doc.text(label, xPos + 2, currentY + 5);
            doc.setFont("helvetica", "normal");
            doc.text(String(value), xPos + 45, currentY + 5);
            doc.rect(xPos, currentY, width, lineH);
        };

        // Fila 1: Circuito y Zona
        drawRow("CIRCUITO:", document.getElementById('poda-circuito').value, 10, 95);
        drawRow("ZONA TRABAJO:", document.getElementById('poda-zona').value, 105, 95);
        currentY += lineH;

        // Fila 2: Fecha (EN BLANCO) y Horarios
        drawRow("FECHA:", "", 10, 95); // Campo en blanco solicitado
        drawRow("HORARIO:", `INICIO: ${document.getElementById('h-ini').value} / FIN: ${document.getElementById('h-fin').value}`, 105, 95);
        currentY += lineH;

        // Fila 3: Trabajo Ejecutado
        const trabajo = `Brecha: ${document.getElementById('m-brecha').value}m | Poda: ${document.getElementById('m-poda').value}m | Postes: ${document.getElementById('m-postes').value}`;
        drawRow("EJECUTADO:", trabajo, 10, 190);
        currentY += lineH;

        // Fila 4: Personal y Pagos (LO QUE SOLICITASTE)
        const pagos = `Personas: ${document.getElementById('poda-personas').value} | M.O: L. ${document.getElementById('pago-mo').value} | Transp: L. ${document.getElementById('pago-trans').value}`;
        drawRow("PERSONAL/PAGO:", pagos, 10, 190);
        currentY += lineH;

        // Fila 5: Responsables y GPS
        drawRow("RESPONSABLES:", `${document.getElementById('resp-super').value} / ${document.getElementById('resp-activ').value}`, 10, 190);
        currentY += lineH;
        drawRow("GPS:", `INICIO: ${gpsIni} | FIN: ${gpsFin}`, 10, 190);
        
        return currentY + 10; // Retorna la posición para las fotos
    };

    const leerFoto = (id) => {
        const file = document.getElementById(id).files[0];
        if (!file) return null;
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    };

    // --- PAGINA 1 ---
    let nextY = dibujarCajetinSencillo(5);
 
    const fGrupo = await leerFoto('f-grupo');
    const fVehiculo = await leerFoto('f-vehiculo');
 
    if (fGrupo) {
        doc.setFont("helvetica", "bold"); doc.text("EVIDENCIA GRUPAL:", 15, nextY);
        doc.addImage(fGrupo, 'JPEG', 15, nextY + 5, 180, 85);
        doc.rect(15, nextY + 5, 180, 85);
        nextY += 95;
    }
    if (fVehiculo) {
        doc.setFont("helvetica", "bold"); doc.text("EVIDENCIA VEHÍCULO:", 15, nextY);
        doc.addImage(fVehiculo, 'JPEG', 15, nextY + 5, 180, 85);
        doc.rect(15, nextY + 5, 180, 85);
    }
 
    // Páginas de Identidades y Fotos (Antes/Durante/Después)
    // ... (Se mantiene igual que el código anterior)
    
    // Identidades
    const idsPersonal = [{id:'f-id-f', t:'IDENTIDAD FRENTE'}, {id:'f-id-r', t:'IDENTIDAD REVÉS'}];
    for(let p of idsPersonal){
        const img = await leerFoto(p.id);
        if(img) {
            doc.addPage();
            doc.setFont("helvetica", "bold"); doc.text(p.t, 15, 20);
            doc.addImage(img, 'JPEG', 15, 25, 180, 250); 
            doc.rect(15, 25, 180, 250);
        }
    }

    // Fotos Proceso
    doc.addPage();
    doc.setFont("helvetica", "bold"); doc.text("REGISTRO FOTOGRÁFICO DE PODA", 15, 20);
    const secciones = [
        {t:"ANTES", ids:['f-ini-1','f-ini-2','f-ini-3']},
        {t:"DURANTE", ids:['f-eje-1','f-eje-2','f-eje-3']},
        {t:"DESPUÉS", ids:['f-fin-1','f-fin-2','f-fin-3']}
    ];
    let yImg = 30;
    for(let s of secciones){
        doc.setFontSize(10); doc.text(s.t, 15, yImg);
        yImg += 5; let xImg = 10;
        for(let id of s.ids){
            const img = await leerFoto(id);
            if(img){ doc.addImage(img, 'JPEG', xImg, yImg, 62, 70); doc.rect(xImg, yImg, 62, 70); }
            xImg += 64;
        }
        yImg += 75;
    }

    doc.save(`Informe_Poda_${sectorActivo}.pdf`);
}
 
function previsualizar(input, idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.innerHTML = "";
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = "100%"; img.style.height = "100%";
            img.style.objectFit = "cover"; img.style.borderRadius = "4px";
            contenedor.appendChild(img);
        }
        reader.readAsDataURL(input.files[0]);
    }
}
 
function enviarDatosCloudflare() {
    const data = {
        sector: sectorActivo,
        circuito: document.getElementById('poda-circuito').value,
        zona_trabajo: document.getElementById('poda-zona').value,
        fecha_envio: new Date().toISOString()
    };
    fetch("https://api-cuadrillas.cgujuticalpa.workers.dev/", {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).catch(() => {}); 
}
