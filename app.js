var mapP, markerP;
var gpsIni = "No marcado", gpsFin = "No marcado";
var latIni = null, lngIni = null;
var latFin = null, lngFin = null;

// CREDENCIALES
const USUARIOS = {
    "admin": "admin123",
    "supervisor": "super123"
};

function validarLogin() {
    const u = document.getElementById('user').value;
    const p = document.getElementById('pass').value;

    if (USUARIOS[u] && USUARIOS[u] === p) {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('form-poda-container').style.display = 'block';
        document.getElementById('user-display').innerText = "Usuario: " + u.toUpperCase();
        initMapPoda();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

// MAPA PODA (ESRI SATÉLITE)
function initMapPoda() {
    if (mapP) mapP.remove();

    mapP = L.map('map-poda').setView([14.65, -86.21], 15);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
    }).addTo(mapP);

    markerP = L.marker([14.65, -86.21], { draggable: true }).addTo(mapP);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            let lat = pos.coords.latitude;
            let lng = pos.coords.longitude;
            actualizarMarcador(lat, lng);
        });
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

    if (tipo === 'ini') {
        gpsIni = c;
        latIni = lat;
        lngIni = lng;
    } else {
        gpsFin = c;
        latFin = lat;
        lngFin = lng;
    }

    document.getElementById('coords-display').innerText = `Inicio: ${gpsIni} | Fin: ${gpsFin}`;
}

async function generarPDFPoda() {
    setTimeout(() => { enviarDatosCloudflare(); }, 0);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dibujarMarco = () => { doc.setDrawColor(40); doc.setLineWidth(0.5); doc.rect(5, 5, 200, 287); };

    const leerFoto = (id) => {
        const file = document.getElementById(id).files[0];
        if (!file) return null;
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    };

    dibujarMarco();
    doc.setFontSize(14); doc.text("INFORME DE PODA COMUNITARIA SECTOR: JUTICALPA", 15, 20);
    doc.setFontSize(9);
    doc.text(`CIRCUITO: ${document.getElementById('poda-circuito').value}`, 15, 28);
    doc.text(`ZONA: ${document.getElementById('poda-zona').value} | FECHA: ${document.getElementById('poda-fecha').value}`, 15, 33);
    doc.text(`TRABAJO EJECUTADO: Brecha ${document.getElementById('m-brecha').value}m, Poda ${document.getElementById('m-poda').value}m, Postes ${document.getElementById('m-postes').value}`, 15, 38);
    doc.text(`PAGOS: MO L. ${document.getElementById('pago-mo').value}, Trans L. ${document.getElementById('pago-trans').value}, Personas ${document.getElementById('poda-personas').value}`, 15, 43);
    doc.text(`RESPONSABLES: Super. ${document.getElementById('resp-super').value}, Contr. ${document.getElementById('resp-activ').value}`, 15, 48);
    doc.text(`GPS: Inicio ${gpsIni} / Fin ${gpsFin}`, 15, 53);

    const fGrupo = await leerFoto('f-grupo');
    const fVehiculo = await leerFoto('f-vehiculo');

    if (fGrupo && fVehiculo) {
        // AMBAS FOTOS: Grupo (arriba), Vehículo (abajo)
        doc.text("EVIDENCIA GRUPAL:", 15, 63);
        doc.addImage(fGrupo, 'JPEG', 15, 68, 180, 100);
        doc.rect(15, 68, 180, 100);
        
        doc.text("EVIDENCIA VEHÍCULO:", 15, 178);
        doc.addImage(fVehiculo, 'JPEG', 15, 183, 180, 100);
        doc.rect(15, 183, 180, 100);
    } else if (fGrupo) {
        // SOLO GRUPO: Formato original grande
        doc.text("EVIDENCIA GRUPAL:", 15, 63);
        doc.addImage(fGrupo, 'JPEG', 10, 68, 190, 120);
        doc.rect(10, 68, 190, 120);
    }

    const idsPersonal = [{id:'f-id-f', t:'IDENTIDAD FRENTE'}, {id:'f-id-r', t:'IDENTIDAD REVÉS'}];
    for(let p of idsPersonal){
        const img = await leerFoto(p.id);
        if(img) {
            doc.addPage(); dibujarMarco();
            doc.text(p.t, 15, 15); doc.addImage(img, 'JPEG', 10, 20, 190, 260); doc.rect(10, 20, 190, 260);
        }
    }

    doc.addPage(); dibujarMarco();
    const secciones = [{t:"FOTOS ANTES", ids:['f-ini-1','f-ini-2','f-ini-3']},{t:"FOTOS DURANTE", ids:['f-eje-1','f-eje-2','f-eje-3']},{t:"FOTOS DESPUÉS", ids:['f-fin-1','f-fin-2','f-fin-3']}];
    let y = 15;
    for(let s of secciones){
        doc.text(s.t, 15, y); y+=5; let x = 10;
        for(let id of s.ids){
            const img = await leerFoto(id);
            if(img){ doc.addImage(img, 'JPEG', x, y, 62, 78); doc.rect(x, y, 62, 78); }
            x+=64;
        }
        y+=85;
    }

    doc.save("Informe_Poda_Final.pdf");
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
        circuito: document.getElementById('poda-circuito').value,
        zona_trabajo: document.getElementById('poda-zona').value,
        fecha: document.getElementById('poda-fecha').value,
        gps_inicio: gpsIni,
        gps_final: gpsFin,
        // ... resto de campos se mantienen
        fecha_envio: new Date().toISOString()
    };
    fetch("https://api-cuadrillas.cgujuticalpa.workers.dev/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).catch(() => {}); 
}
