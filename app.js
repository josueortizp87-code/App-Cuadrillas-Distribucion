var mapI, mapP, markerI, markerP;
var gpsIni = "No marcado", gpsFin = "No marcado";
var prioridadSeleccionada = "";

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
    }
    window.scrollTo(0,0);
}

function volverAlDashboard() {
    ocultarTodo();
    document.getElementById('dashboard').style.display = 'block';
}

function ocultarTodo() {
    const ids = ['dashboard','submenu-mantenimiento','form-inspeccion-container','form-poda-container'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
}

function seleccionarPrioridad(btn, valor) {
    const btns = document.querySelectorAll('.btn-prioridad');
    btns.forEach(b => b.style.background = '#333');
    btn.style.background = '#f1c40f';
    btn.style.color = 'black';
    prioridadSeleccionada = valor;
}

function initMapInsp() {
    if (mapI) mapI.remove();
    mapI = L.map('map-insp').setView([14.65, -86.21], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapI);
    markerI = L.marker([14.65, -86.21], {draggable: true}).addTo(mapI);
    markerI.on('move', function(e) {
        let p = e.target.getLatLng();
        document.getElementById('txt-coords-insp').innerText = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    });
    setTimeout(() => mapI.invalidateSize(), 300);
}

function initMapPoda() {
    if (mapP) mapP.remove();
    mapP = L.map('map-poda').setView([14.65, -86.21], 14);
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

async function generarPDFPoda() {
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
    doc.text(`METRICAS: Brecha ${document.getElementById('m-brecha').value}m, Poda ${document.getElementById('m-poda').value}m, Postes ${document.getElementById('m-postes').value}`, 15, 38);
    doc.text(`PAGOS: MO L${document.getElementById('pago-mo').value}, Trans L${document.getElementById('pago-trans').value}, Personas ${document.getElementById('poda-personas').value}`, 15, 43);
    doc.text(`RESPONSABLES: Super. ${document.getElementById('resp-super').value}, Activ. ${document.getElementById('resp-activ').value}`, 15, 48);
    doc.text(`GPS: Inicio ${gpsIni} / Fin ${gpsFin}`, 15, 53);

    const fGrupo = await leerFoto('f-grupo');
    if(fGrupo) { doc.text("EVIDENCIA GRUPAL:", 15, 63); doc.addImage(fGrupo, 'JPEG', 10, 68, 190, 120); doc.rect(10, 68, 190, 120); }

    const idsPersonal = [{id:'f-id-f', t:'IDENTIDAD FRENTE'}, {id:'f-id-r', t:'IDENTIDAD REVÉS'}];
    for(let p of idsPersonal){
        doc.addPage(); dibujarMarco();
        const img = await leerFoto(p.id);
        if(img) { doc.text(p.t, 15, 15); doc.addImage(img, 'JPEG', 10, 20, 190, 260); doc.rect(10, 20, 190, 260); }
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

    doc.addPage(); dibujarMarco();
    const rec = await leerFoto('f-recibo');
    if(rec){ doc.text("RECIBO DE CAJA", 15, 15); doc.addImage(rec, 'JPEG', 10, 20, 190, 260); doc.rect(10, 20, 190, 260); }

    doc.save("Informe_Poda_Final.pdf");
}
