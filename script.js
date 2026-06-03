// Configuración base de la simulación
const CIRCUITO = { vueltasTotales: 53, tiempoBaseS: 84.0 };

const COMPUESTOS = {
    SOFT: { nombre: 'Blando', degradacion: 0.14, tiempoInicial: 0.0, color: '#f87171' },     // Se degrada rápido
    MEDIUM: { nombre: 'Medio', degradacion: 0.07, tiempoInicial: 0.4, color: '#facc15' },   // Degradación media
    HARD: { nombre: 'Duro', degradacion: 0.02, tiempoInicial: 1.1, color: '#38bdf8' }       // Muy consistente
};

const EFECTO_COMBUSTIBLE = 0.03; // El auto se vuelve 0.03s más rápido por vuelta al vaciarse
let chartInstance = null;

// Captura de elementos del DOM
const tyreSelect1 = document.getElementById('tyreSelect1');
const tyreSelect2 = document.getElementById('tyreSelect2');
const lapsRange = document.getElementById('lapsRange');
const lapsValue = document.getElementById('lapsValue');
const runBtn = document.getElementById('runBtn');

// Sincronizar el texto del slider
lapsRange.addEventListener('input', (e) => {
    lapsValue.textContent = `${e.target.value} vueltas`;
});

// Función que calcula los tiempos vuelta a vuelta para un compuesto determinado
function calcularTiemposStint(compuesto, vueltasTotalesAжной) {
    let tiempos = [];
    for (let v = 1; v <= vueltasTotalesAжной; v++) {
        // Penalización por degradación acumulada de la goma
        let penalizacionGoma = COMPUESTOS[compuesto].degradacion * (v - 1);
        
        // Ventaja por combustible consumido (a menos vueltas restantes, auto más liviano)
        let vueltasRestantes = CIRCUITO.vueltasTotales - v;
        let ventajaCombustible = vueltasRestantes * EFECTO_COMBUSTIBLE;

        // Tiempo final de la vuelta
        let tiempoVuelta = CIRCUITO.tiempoBaseS + COMPUESTOS[compuesto].tiempoInicial + penalizacionGoma + ventajaCombustible;
        tiempos.push(parseFloat(tiempoVuelta.toFixed(2)));
    }
    return tiempos;
}

// Renderizar el gráfico con ambos sets de datos
function actualizarSimulacion() {
    const vueltas = parseInt(lapsRange.value);
    
    // Calcular datos de ambos autos
    const datosAuto1 = calcularTiemposStint(tyreSelect1.value, vueltas);
    const datosAuto2 = calcularTiemposStint(tyreSelect2.value, vueltas);

    // Generar etiquetas de vueltas (V1, V2, V3...)
    let labels = Array.from({length: vueltas}, (_, i) => `V${i + 1}`);

    // Si ya existe un gráfico, lo destruimos para renderizar el nuevo limpiamente
    if (chartInstance) { chartInstance.destroy(); }

    const ctx = document.getElementById('strategyChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Auto 1: ${COMPUESTOS[tyreSelect1.value].nombre}`,
                    data: datosAuto1,
                    borderColor: COMPUESTOS[tyreSelect1.value].color,
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointRadius: 2,
                    tension: 0.1
                },
                {
                    label: `Auto 2: ${COMPUESTOS[tyreSelect2.value].nombre}`,
                    data: datosAuto2,
                    borderColor: COMPUESTOS[tyreSelect2.value].color,
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointRadius: 2,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: { color: '#1e293b' },
                    ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' } },
                    title: { display: true, text: 'Tiempo de Vuelta (Segundos)', color: '#64748b' }
                },
                x: {
                    grid: { color: '#1e293b' },
                    ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' } }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#f8fafc', font: { family: 'JetBrains Mono', size: 11 } }
                }
            }
        }
    });
}

// Listeners
runBtn.addEventListener('click', actualizarSimulacion);
window.onload = actualizarSimulacion;
