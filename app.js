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

function marcar(t) {
    let p = marker.getLatLng();
    let c = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    if(t === 'ini') gIni = c; else gFin = c;
    document.getElementById('c-txt').innerText = `Inicio: ${gIni} | Fin: ${gFin}`;
}

function drawHeader(doc, s) {
    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277); // Marco
    doc.line(10, 30, 200, 30);  // Base
    doc.line(65, 10, 65, 30);   // Divisor logo
    doc.line(140, 10, 140, 30); // Divisor título
    doc.line(140, 17, 200, 17); // Divisor Código
    doc.line(140, 24, 200, 24); // Divisor Versión
    doc.line(165, 10, 165, 30); // Divisor etiquetas

    // Insertar Logo (Usando el elemento de la interfaz para evitar bloqueos)
    const imgLogo = document.getElementById('logo-main');
    doc.addImage(imgLogo, 'PNG', 15, 12, 45, 15);
    
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text("INFORME DE PODA COMUNITARIA", 102, 18, {align:"center"});
    doc.text("SECTOR " + s, 102, 23, {align:"center"});

    doc.setFontSize(7);
    doc.text("Código", 142, 15);
    doc.text("Versión", 142, 22); doc.text("1", 182, 22);
    doc.text("Fecha", 142, 28); // Queda en blanco según solicitado
}

async function crearPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const getB64 = (id) => {
            const f = document.getElementById(id).files[0];
            if(!f) return null;
            return new Promise(res => { const r = new FileReader(); r.onload = (e) => res(e.target.result); r.readAsDataURL(f); });
        };

        drawHeader(doc, sector);
        doc.setFontSize(9);
        doc.rect(15, 35, 180, 45); // Cuadro info
        
        let info = [
            ["CIRCUITO:", document.getElementById('poda-circuito').value, "SUPERVISOR:", document.getElementById('resp-super').value],
            ["ZONA:", document.getElementById('poda-zona').value, "LÍDER:", document.getElementById('resp-activ').value],
            ["FECHA:", document.getElementById('poda-fecha').value, "PERSONAS:", document.getElementById('poda-personas').value],
            ["HORARIO:", `${document.getElementById('h-ini').value} - ${document.getElementById('h-fin').value}`, "GPS INI:", gIni],
            ["TRABAJO:", `${document.getElementById('m-brecha').value}m Brecha / ${document.getElementById('m-poda').value}m Poda`, "GPS FIN:", gFin]
        ];

        let yI = 42;
        info.forEach(row => {
            doc.setFont("helvetica", "bold"); doc.text(row[0], 18, yI);
            doc.setFont("helvetica", "normal"); doc.text(row[1] || "", 40, yI);
            doc.setFont("helvetica", "bold"); doc.text(row[2], 100, yI);
            doc.setFont("helvetica", "normal"); doc.text(row[3] || "", 125, yI);
            yI += 7;
        });

        const fG = await getB64('f-grupo'), fV = await getB64('f-vehiculo');
        if(fG) { doc.setFont("helvetica", "bold"); doc.text("FOTO GRUPO", 105, 88, {align:"center"}); doc.addImage(fG, 'JPEG', 30, 92, 150, 85); doc.rect(30, 92, 150, 85); }
        if(fV) { doc.setFont("helvetica", "bold"); doc.text("FOTO VEHÍCULO", 105, 188, {align:"center"}); doc.addImage(fV, 'JPEG', 30, 192, 150, 85); doc.rect(30, 192, 150, 85); }

        // PÁGINA 2: LÍDER
        const fLF = await getB64('f-lider-f'), fLR = await getB64('f-lider-r');
        if(fLF || fLR) {
            doc.addPage(); drawHeader(doc, sector);
            doc.setFontSize(12); doc.text("LIDER DE CUADRILLA", 105, 45, {align:"center"});
            if(fLF) { doc.addImage(fLF, 'JPEG', 55, 60, 100, 75); doc.rect(55, 60, 100, 75); }
            if(fLR) { doc.addImage(fLR, 'JPEG', 55, 150, 100, 75); doc.rect(55, 150, 100, 75); }
        }

        // PÁGINAS DNI AMPLIADAS (Margen ~1cm)
        const dnis = [{id:'f-id-f', t:'IDENTIDAD FRENTE'}, {id:'f-id-r', t:'IDENTIDAD REVÉS'}];
        for(let d of dnis) {
            const img = await getB64(d.id);
            if(img) {
                doc.addPage(); drawHeader(doc, sector);
                doc.setFontSize(12); doc.setFont("helvetica", "bold");
                doc.text(d.t, 105, 45, {align:"center"});
                doc.addImage(img, 'JPEG', 15, 55, 180, 210); // Más grande verticalmente
                doc.rect(15, 55, 180, 210);
            }
        }

        // PÁGINA EVIDENCIA
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

        doc.save(`Reporte_${sector}.pdf`);
    } catch (e) {
        alert("Error al generar PDF: " + e.message);
        console.error(e);
    }
}

function previsualizar(input, id) {
    const b = document.getElementById(id); b.innerHTML = "";
    if(input.files[0]) {
        const r = new FileReader();
        r.onload = (e) => { const i = document.createElement('img'); i.src = e.target.result; i.style.width="100%"; i.style.height="100%"; i.style.objectFit="cover"; b.appendChild(i); };
        r.readAsDataURL(input.files[0]);
    }
}
