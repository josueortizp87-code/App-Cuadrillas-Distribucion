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
    // Intentamos enviar, pero si falla (error 500 o CORS) no bloqueamos el PDF
    try {
        enviarDatosCloudflare();
    } catch(e) {}

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
 
    const aplicarFormatoBase = () => {
        // Marco
        doc.setDrawColor(0); 
        doc.setLineWidth(0.5); 
        doc.rect(5, 5, 200, 287); 
        doc.line(5, 35, 205, 35); 
        
        // REEMPLAZO DE LOGO POR TEXTO PARA EVITAR ERRORES
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("ENEE", 15, 25);
        
        doc.setFontSize(12);
        doc.text("EMPRESA NACIONAL DE ENERGÍA ELÉCTRICA", 60, 15);
        doc.setFontSize(10);
        doc.text("INFORME DE PODA COMUNITARIA", 60, 22);
        doc.text("SECTOR: " + sectorActivo, 60, 28);
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
    aplicarFormatoBase();
    doc.setDrawColor(40);
    doc.rect(10, 40, 190, 45); 
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold"); doc.text("CIRCUITO:", 15, 48);
    doc.setFont("helvetica", "normal"); doc.text(document.getElementById('poda-circuito').value || "", 55, 48);
    
    doc.setFont("helvetica", "bold"); doc.text("ZONA DE TRABAJO:", 15, 54);
    doc.setFont("helvetica", "normal"); doc.text(document.getElementById('poda-zona').value || "", 55, 54);
    
    doc.setFont("helvetica", "bold"); doc.text("FECHA:", 15, 60);
    doc.setFont("helvetica", "normal"); doc.text(document.getElementById('poda-fecha').value || "", 55, 60);
    
    doc.setFont("helvetica", "bold"); doc.text("TRABAJO EJECUTADO:", 15, 66);
    doc.setFont("helvetica", "normal"); 
    doc.text(`Brecha: ${document.getElementById('m-brecha').value}m | Poda: ${document.getElementById('m-poda').value}m | Postes: ${document.getElementById('m-postes').value}`, 55, 66);
    
    doc.setFont("helvetica", "bold"); doc.text("RESPONSABLES:", 15, 72);
    doc.setFont("helvetica", "normal");
    doc.text(`Supervisor: ${document.getElementById('resp-super').value} | Contr: ${document.getElementById('resp-activ').value}`, 55, 72);
    
    doc.setFont("helvetica", "bold"); doc.text("GPS:", 15, 78);
    doc.setFont("helvetica", "normal");
    doc.text(`Inicio: ${gpsIni} / Fin: ${gpsFin}`, 55, 78);
 
    const fGrupo = await leerFoto('f-grupo');
    const fVehiculo = await leerFoto('f-vehiculo');
 
    if (fGrupo) {
        doc.setFont("helvetica", "bold"); doc.text("EVIDENCIA GRUPAL:", 15, 95);
        doc.addImage(fGrupo, 'JPEG', 15, 100, 180, 85);
        doc.rect(15, 100, 180, 85);
    }
    if (fVehiculo) {
        doc.setFont("helvetica", "bold"); doc.text("EVIDENCIA VEHÍCULO:", 15, 195);
        doc.addImage(fVehiculo, 'JPEG', 15, 200, 180, 85);
        doc.rect(15, 200, 180, 85);
    }
 
    const idsPersonal = [{id:'f-id-f', t:'IDENTIDAD FRENTE'}, {id:'f-id-r', t:'IDENTIDAD REVÉS'}];
    for(let p of idsPersonal){
        const img = await leerFoto(p.id);
        if(img) {
            doc.addPage(); 
            aplicarFormatoBase();
            doc.setFont("helvetica", "bold"); doc.text(p.t, 15, 45);
            doc.addImage(img, 'JPEG', 10, 50, 190, 230); 
            doc.rect(10, 50, 190, 230);
        }
    }
 
    doc.addPage(); 
    aplicarFormatoBase();
    const secciones = [
        {t:"FOTOS ANTES", ids:['f-ini-1','f-ini-2','f-ini-3']},
        {t:"FOTOS DURANTE", ids:['f-eje-1','f-eje-2','f-eje-3']},
        {t:"FOTOS DESPUÉS", ids:['f-fin-1','f-fin-2','f-fin-3']}
    ];
    let y = 45;
    for(let s of secciones){
        doc.setFont("helvetica", "bold"); doc.text(s.t, 15, y); 
        y+=5; let x = 10;
        for(let id of s.ids){
            const img = await leerFoto(id);
            if(img){ doc.addImage(img, 'JPEG', x, y, 62, 70); doc.rect(x, y, 62, 70); }
            x+=64;
        }
        y+=75;
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
