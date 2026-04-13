// --- VARIABLES GLOBALES ---
var map, marcador;
var prioridadSeleccionada = "MEDIA";

// --- NAVEGACIÓN ---
function mostrarSubmenu(tipo) {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('form-inspeccion-container').style.display = 'none';
    document.getElementById('submenu-mantenimiento').style.display = 'block';
}

function volverAlDashboard() {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('submenu-mantenimiento').style.display = 'none';
}

function mostrarFormulario(tipo) {
    if(tipo === 'inspeccion') {
        document.getElementById('submenu-mantenimiento').style.display = 'none';
        document.getElementById('form-inspeccion-container').style.display = 'block';

        // 1. Generar ID Automático
        document.getElementById('id-insp').value = "INSP-" + Math.floor(Math.random() * 1000000);

        // 2. Inicializar Mapa si no existe
        initMapa();
    }
}

// --- MAPA ---
function initMapa() {
    if (!map) {
        map = L.map('map').setView([14.65, -86.21], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        marcador = L.marker([14.65, -86.21], {draggable: true}).addTo(map);

        marcador.on('dragend', function() {
            let p = marcador.getLatLng();
            document.getElementById('txt-coords').innerText = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
        });

        // Intentar obtener GPS real automáticamente
        navigator.geolocation.getCurrentPosition(pos => {
            let p = [pos.coords.latitude, pos.coords.longitude];
            map.setView(p, 18);
            marcador.setLatLng(p);
            document.getElementById('txt-coords').innerText = p[0].toFixed(6) + ", " + p[1].toFixed(6);
        });
    }
}

// --- LÓGICA DE BOTONES ---
function seleccionar(btn, valor) {
    let parent = btn.parentElement;
    parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    prioridadSeleccionada = valor;
}

function finalizarInspeccion() {
    alert("Inspección " + document.getElementById('id-insp').value + " Guardada Correctamente");
    volverAlDashboard();
}
