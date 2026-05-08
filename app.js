var map, marker, gIni = "--", gFin = "--", sector = "";

function validarLogin() {
    const s = document.getElementById('user-sector').value;
    const p = document.getElementById('pass').value;
    if (p === "enee2026") {
        sector = s;
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('form-poda-container').style.display = 'block';
        document.getElementById('sector-title').innerText = "SECTOR " + s + " - PODA COMUNITARIA";
        initMap();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

function initMap() {
    map = L.map('map-poda').setView([14.65, -86.21], 15);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(map);
    marker = L.marker([14.65, -86.21], {draggable: true}).addTo(map);
}

function setManual() {
    const lt = parseFloat(document.getElementById('lat-m').value);
    const lg = parseFloat(document.getElementById('lng-m').value);
    if(lt && lg) { map.setView([lt, lg], 17); marker.setLatLng([lt, lg]); }
}

function marcar(t) {
    let p = marker.getLatLng();
    let c = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    if(t === 'ini') gIni = c; else gFin = c;
    document.getElementById('c-txt').innerText = `Inicio: ${gIni} | Fin: ${gFin}`;
}

function drawHeader(doc, s) {
    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277); // Marco de la hoja
    doc.line(10, 30, 200, 30);  // Base del encabezado
    doc.line(65, 10, 65, 30);   // Divisor logo
    doc.line(140, 10, 140, 30); // Divisor título
    doc.line(140, 17, 200, 17); // Divisor Código
    doc.line(140, 24, 200, 24); // Divisor Versión
    doc.line(165, 10, 165, 30); // Divisor etiquetas internas

    // Logo ENEE (URL pública del logo)
    const logo = "https://www.eneeutcd.hn/es/dominios/enee.pagegear.co/plantillas/2024/recursos/logo_utcd.svg";
    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.text("UTCD", 37, 20, {align:"center"});
    
    doc.setFontSize(9);
    doc.text("INFORME DE PODA COMUNITARIA", 102, 18, {align:"center"});
    doc.text("SECTOR " + s, 102, 23, {align:"center"});

    doc.setFontSize(7);
    doc.text("Código", 142, 15);
    doc.text("Versión", 142, 22); doc.text("1", 182, 22);
    doc.text("Fecha", 142, 28); doc.text(new Date().toLocaleDateString(), 170, 28);
}

async function crearPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const getB64 = (id) => {
        const f = document.getElementById(id).files[0];
        if(!f) return null;
        return new Promise(res => { const r = new FileReader(); r.onload = (e) => res(e.target.result); r.readAsDataURL(f); });
    };

    // PÁGINA 1: DATOS Y PRINCIPALES
    drawHeader(doc, sector);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.rect(15, 35, 180, 45); // Cuadro de información
    
    let info = [
        ["CIRCUITO:", document.getElementById('poda-circuito').value, "SUPERVISOR:", document.getElementById('resp-super').value],
        ["ZONA:", document.getElementById('poda-zona').value, "LÍDER:", document.getElementById('resp-activ').value],
        ["FECHA:", document.getElementById('poda-fecha').value, "PERSONAS:", document.getElementById('poda-personas').value],
        ["GPS INI:", gIni, "GPS FIN:", gFin],
        ["TRABAJO:", `${document.getElementById('m-brecha').value}m Brecha / ${document.getElementById('m-poda').value}m Poda`, "", ""]
    ];

    let yI = 42;
    info.forEach(row => {
        doc.setFont("helvetica", "bold"); doc.text(row[0], 18, yI);
        doc.setFont("helvetica", "normal"); doc.text(row[1], 40, yI);
        doc.setFont("helvetica", "bold"); doc.text(row[2], 100, yI);
        doc.setFont("helvetica", "normal"); doc.text(row[3], 125, yI);
        yI += 7;
    });

    const fG = await getB64('f-grupo'), fV = await getB64('f-vehiculo');
    if(fG) { doc.text("FOTO GRUPO", 105, 88, {align:"center"}); doc.addImage(fG, 'JPEG', 30, 92, 150, 85); doc.rect(30, 92, 150, 85); }
    if(fV) { doc.text("FOTO VEHÍCULO", 105, 188, {align:"center"}); doc.addImage(fV, 'JPEG', 30, 192, 150, 85); doc.rect(30, 192, 150, 85); }

    // PÁGINA 2: LÍDER
    const fLF = await getB64('f-lider-f'), fLR = await getB64('f-lider-r');
    if(fLF || fLR) {
        doc.addPage(); drawHeader(doc, sector);
        doc.setFontSize(12); doc.text("LIDER DE CUADRILLA", 105, 45, {align:"center"});
        if(fLF) { doc.addImage(fLF, 'JPEG', 55, 60, 100, 75); doc.rect(55, 60, 100, 75); }
        if(fLR) { doc.addImage(fLR, 'JPEG', 55, 150, 100, 75); doc.rect(55, 150, 100, 75); }
    }

    // PÁGINA 3: DNI FRENTE
    const fDF = await getB64('f-id-f');
    if(fDF) { doc.addPage(); drawHeader(doc, sector); doc.text("IDENTIDAD FRENTE", 105, 45, {align:"center"}); doc.addImage(fDF, 'JPEG', 20, 60, 170, 110); doc.rect(20, 60, 170, 110); }

    // PÁGINA 4: DNI REVÉS
    const fDR = await getB64('f-id-r');
    if(fDR) { doc.addPage(); drawHeader(doc, sector); doc.text("IDENTIDAD REVÉS", 105, 45, {align:"center"}); doc.addImage(fDR, 'JPEG', 20, 60, 170, 110); doc.rect(20, 60, 170, 110); }

    // PÁGINA 5: EVIDENCIA CAMPO (9 FOTOS)
    doc.addPage(); drawHeader(doc, sector);
    let cats = [
        {t:"ANTES", ids:['f-a1','f-a2','f-a3']},
        {t:"DURANTE", ids:['f-d1','f-d2','f-d3']},
        {t:"DESPUÉS", ids:['f-f1','f-f2','f-f3']}
    ];
    let yE = 45;
    for(let c of cats) {
        doc.setFont("helvetica", "bold"); doc.text(c.t, 15, yE);
        let xE = 15;
        for(let id of c.ids) {
            let img = await getB64(id);
            if(img) { doc.addImage(img, 'JPEG', xE, yE+5, 58, 65); doc.rect(xE, yE+5, 58, 65); }
            xE += 62;
        }
        yE += 80;
    }

    doc.save(`Informe_Poda_${sector}_${document.getElementById('poda-circuito').value}.pdf`);
    enviarCF();
}

function previsualizar(input, id) {
    const b = document.getElementById(id); b.innerHTML = "";
    if(input.files[0]) {
        const r = new FileReader();
        r.onload = (e) => { const i = document.createElement('img'); i.src = e.target.result; i.style.width="100%"; i.style.height="100%"; i.style.objectFit="cover"; b.appendChild(i); };
        r.readAsDataURL(input.files[0]);
    }
}

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
