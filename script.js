// Configuración del circuito
const CIRCUITO = { vueltasTotales: 53, tiempoBaseS: 84.0 };

const COMPUESTOS = {
    SOFT: { degradacion: 0.12, tiempoInicial: 0.0, color: '#f87171' },
    MEDIUM: { degradacion: 0.06, tiempoInicial: 0.4, color: '#facc15' },
    HARD: { degradacion: 0.02, tiempoInicial: 0.9, color: '#e2e8f0' }
};

const EFECTO_COMBUSTIBLE = 0.03;
let chartInstance = null;

// Elementos del DOM
const tyreSelect = document.getElementById('tyreSelect');
const lapsRange = document.getElementById('lapsRange');
const lapsValue = document.getElementById('lapsValue');
const runBtn = document.getElementById('runBtn');

// Actualizar etiqueta de vueltas en vivo
lapsRange.addEventListener('input', (e) => {
    lapsValue.textContent = `${e.target.value} vueltas`;
});

// Función matemática de simulación
function simularEstrategia(compuesto, vueltas) {
    let labels = [];
    let dataTiempos = [];

    for (let v = 1; v <= vueltas; v++) {
        let penalizacionGoma = COMPUESTOS[compuesto].degradacion * (v - 1);
        let vueltasRestantes = CIRCUITO.vueltasTotales - v;
        let ventajaCombustible = vueltasRestantes * EFECTO_COMBUSTIBLE;

        let tiempoVuelta = CIRCUITO.tiempoBaseS + COMPUESTOS[compuesto].tiempoInicial + penalizacionGoma + ventajaCombustible;
        
        labels.push(`V${v}`);
        dataTiempos.push(tiempoVuelta.toFixed(2));
    }
    return { labels, dataTiempos };
}

// Renderizar o actualizar gráfico con Chart.js
function actualizarGrafico() {
    const compuesto = tyreSelect.value;
    const vueltas = parseInt(lapsRange.value);
    const { labels, dataTiempos } = simularEstrategia(compuesto, vueltas);

    if (chartInstance) { chartInstance.destroy(); }

    const ctx = document.getElementById('strategyChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Ritmo con Goma ${tyreSelect.options[tyreSelect.selectedIndex].text}`,
                data: dataTiempos,
                borderColor: COMPUESTOS[compuesto].color,
                backgroundColor: 'rgba(0,0,0,0)',
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }
            },
            plugins: { legend: { labels: { color: '#f8fafc', font: { family: 'JetBrains Mono' } } } }
        }
    });
}

// Escuchar click de ejecución
runBtn.addEventListener('click', actualizarGrafico);
// Cargar por defecto al abrir la página
window.onload = actualizarGrafico;
