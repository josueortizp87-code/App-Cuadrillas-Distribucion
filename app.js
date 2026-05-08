var mapP, markerP;
var gpsIni = "No marcado", gpsFin = "No marcado";
var currentSector = "";

const SECTORES_PASS = "enee2024"; // Contraseña única para todos los sectores por ahora

function validarLogin() {
    const sector = document.getElementById('user-sector').value;
    const pass = document.getElementById('pass').value;

    if (pass === SECTORES_PASS || (sector === "ADMIN" && pass === "admin123")) {
        currentSector = sector;
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('form-poda-container').style.display = 'block';
        document.getElementById('header-sector-title').innerText = `SECTOR ${sector} - PODA COMUNITARIA`;
        document.getElementById('user-display').innerText = "SESIÓN: " + sector;
        initMapPoda();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

// Configuración del Mapa (Esri Satelital)
function initMapPoda() {
    if (mapP) mapP.remove();
    mapP = L.map('map-poda').setView([14.65, -86.21], 15);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(mapP);
    markerP = L.marker([14.65, -86.21], { draggable: true }).addTo(mapP);
}

// Función para dibujar el encabezado técnico en cada página
function dibujarEncabezadoTecnico(doc, sector) {
    // Marco exterior
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277); // Marco principal de la hoja

    // Estructura del encabezado (Imagen 1)
    doc.line(10, 30, 200, 30); // Línea inferior del encabezado
    doc.line(65, 10, 65, 30);  // Divisor logo
    doc.line(140, 10, 140, 30); // Divisor título/datos
    doc.line(140, 17, 200, 17); // Divisor código/versión
    doc.line(140, 24, 200, 24); // Divisor versión/fecha
    doc.line(165, 10, 165, 30); // Divisor etiquetas/valores

    // Logo (Simulado con texto si no hay base64, pero usaremos el espacio)
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("UTCD", 30, 20, {align: "center"});
    doc.setFontSize(5);
    doc.text("UNIDAD TÉCNICA DE CONTROL\nDE DISTRIBUCIÓN", 30, 24, {align: "center"});

    // Título Central
    doc.setFontSize(9);
    doc.text("INFORME DE PODA COMUNITARIA", 102, 18, {align: "center"});
    doc.text(`SECTOR ${sector}`, 102, 23, {align: "center"});

    // Datos Derecha
    doc.setFontSize(7);
    doc.text("Código", 142, 15);
    doc.text("Versión", 142, 22); doc.text("1", 182, 22);
    doc.text("Fecha", 142, 28);
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
    doc.text("EVIDENCIA GRUPAL:", 15, 63);
    doc.addImage(fGrupo, 'JPEG', 15, 68, 180, 80);
    doc.rect(15, 68, 180, 80);
    
    doc.text("EVIDENCIA VEHÍCULO:", 15, 155);
    doc.addImage(fVehiculo, 'JPEG', 15, 160, 180, 80);
    doc.rect(15, 160, 180, 80);
} else if (fGrupo) {
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
// --- ENVÍO DE DATOS A CLOUDFLARE (NO INVASIVO) ---
function enviarDatosCloudflare() {
    const data = {
        circuito: document.getElementById('poda-circuito').value,
        zona_trabajo: document.getElementById('poda-zona').value,
        fecha: document.getElementById('poda-fecha').value,
        hora_inicio: document.getElementById('h-ini').value,
        hora_final: document.getElementById('h-fin').value,

        gps_inicio: gpsIni,
        gps_final: gpsFin,
        lat_inicio: latIni,
        lng_inicio: lngIni,
        lat_final: latFin,
        lng_final: lngFin,

        m_brecha: document.getElementById('m-brecha').value,
        m_poda: document.getElementById('m-poda').value,
        m_postes: document.getElementById('m-postes').value,

        personas: document.getElementById('poda-personas').value,
        pago_mo: document.getElementById('pago-mo').value,
        pago_trans: document.getElementById('pago-trans').value,

        responsable_super: document.getElementById('resp-super').value,
        responsable_contratista: document.getElementById('resp-activ').value,

        fecha_envio: new Date().toISOString()
    };

    fetch("https://api-cuadrillas.cgujuticalpa.workers.dev/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).catch(() => {}); 
}
