const VUELTAS_CARRERA = 53;
const TIEMPO_BASE = 84.0; // 1:24.0
const PIT_STOP_PENALTY = 25.0; // Tiempo perdido en pits (Monza)

// Biblioteca de compuestos avanzada
const COMPUESTOS = {
    SOFT:   { nombre: 'Soft', degradacion: 0.16, tiempoInicial: 0.0, rendimientoLluvia: 4.5 },
    MEDIUM: { nombre: 'Medium', degradacion: 0.08, tiempoInicial: 0.4, rendimientoLluvia: 4.5 },
    HARD:   { nombre: 'Hard', degradacion: 0.03, tiempoInicial: 1.1, rendimientoLluvia: 5.5 },
    INT:    { nombre: 'Inter', degradacion: 0.40, tiempoInicial: 3.5, rendimientoLluvia: 0.0 }, // Malo en seco
    WET:    { nombre: 'Wet', degradacion: 0.60, tiempoInicial: 5.5, rendimientoLluvia: -1.5 } // Ideal con mucha agua
};

let chartInstance = null;

// Función para simular una carrera completa de un auto
function simularCarreraCompleta(config) {
    let tiemposVuelta = [];
    let tiempoTotalAcumulado = 0;
    let edadGoma = 0;
    let compuestoActual = config.tyre1;

    for (let v = 1; v <= VUELTAS_CARRERA; v++) {
        // 1. Control de Parada en Box
        let penalizacionBox = 0;
        if (v === config.lapPit + 1) {
            compuestoActual = config.tyre2;
            edadGoma = 0;
            penalizacionBox = PIT_STOP_PENALTY;
        }

        // 2. Determinar Clima de la vuelta actual
        let climaVuelta = 'DRY';
        if (config.weather === 'HEAVY_RAIN') climaVuelta = 'HEAVY';
        else if (config.weather === 'RAIN_V20' && v >= 20) climaVuelta = 'LIGHT';

        // 3. Multiplicadores por Estilo de Conducción
        let modificadorRitmo = 0; // Segundos ganados/perdidos
        let modificadorDegradacion = 1.0;

        if (config.pace === 'PUSH') {
            modificadorRitmo = -0.5; // Va más rápido
            modificadorDegradacion = 1.8; // Destruye gomas
        } else if (config.pace === 'SAVE') {
            modificadorRitmo = 0.4; // Va más lento
            modificadorDegradacion = 0.5; // Protege gomas
        }

        // 4. Lógica de Degradación de neumáticos
        let degradacionBase = COMPUESTOS[compuestoActual].degradacion * edadGoma * modificadorDegradacion;
        
        // Si usas gomas de lluvia en seco, se destruyen al triple
        if (climaVuelta === 'DRY' && (compuestoActual === 'INT' || compuestoActual === 'WET')) {
            degradacionBase *= 3.5;
        }

        // 5. Ventaja de Combustible
        let ventajaCombustible = (VUELTAS_CARRERA - v) * 0.03;

        // 6. Impacto del Clima en el Neumático elegido
        let penalizacionClima = 0;
        if (climaVuelta === 'LIGHT') {
            // Lluvia ligera: Inter es el mejor. Gomas de seco patinan (+4.5s)
            penalizacionClima = (compuestoActual === 'INT') ? 1.0 : COMPUESTOS[compuestoActual].rendimientoLluvia;
        } else if (climaVuelta === 'HEAVY') {
            // Lluvia fuerte: Wet es el mejor. Todo lo demás patina agresivo
            if (compuestoActual === 'WET') penalizacionClima = 2.0;
            else if (compuestoActual === 'INT') penalizacionClima = 5.0;
            else penalizacionClima = 12.0; // Neumáticos lisos en tormenta
        } else {
            // Clima Seco: Inter y Wet pierden rendimiento natural
            if (compuestoActual === 'INT' || compuestoActual === 'WET') penalizacionClima = COMPUESTOS[compuestoActual].rendimientoLluvia;
        }

        // Cálculo definitivo de la vuelta
        let tiempoVuelta = TIEMPO_BASE + COMPUESTOS[compuestoActual].tiempoInicial + degradacionBase + ventajaCombustible + penalizacionClima + modificadorRitmo + penalizacionBox;
        
        tiemposVuelta.push(parseFloat(tiempoVuelta.toFixed(2)));
        tiempoTotalAcumulado += tiempoVuelta;
        edadGoma++;
    }

    return { tiemposVuelta, tiempoTotalAcumulado };
}

// Convertir segundos a formato MM:SS
function formatTiempo(segundos) {
    let min = Math.floor(segundos / 60);
    let seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg} min`;
}

// Ejecución general
function procesarSimulacion() {
    const weather = document.getElementById('weatherSelect').value;

    const configA1 = {
        tyre1: document.getElementById('a1_tyre1').value,
        tyre2: document.getElementById('a1_tyre2').value,
        lapPit: parseInt(document.getElementById('a1_pit').value),
        pace: document.getElementById('a1_pace').value,
        weather: weather
    };

    const configA2 = {
        tyre1: document.getElementById('a2_tyre1').value,
        tyre2: document.getElementById('a2_tyre2').value,
        lapPit: parseInt(document.getElementById('a2_pit').value),
        pace: document.getElementById('a2_pace').value,
        weather: weather
    };

    const resA1 = simularCarreraCompleta(configA1);
    const resA2 = simularCarreraCompleta(configA2);

    // Actualizar textos de tiempos totales
    document.getElementById('timeA1').textContent = formatTiempo(resA1.tiempoTotalAcumulado);
    document.getElementById('timeA2').textContent = formatTiempo(resA2.tiempoTotalAcumulado);

    // Eje X: 53 Vueltas
    let labels = Array.from({length: VUELTAS_CARRERA}, (_, i) => `${i + 1}`);

    if (chartInstance) chartInstance.destroy();

    const ctx = document.getElementById('strategyChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Auto 1',
                    data: resA1.tiemposVuelta,
                    borderColor: '#f87171',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 1
                },
                {
                    label: 'Auto 2',
                    data: resA2.tiemposVuelta,
                    borderColor: '#facc15',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }
            },
            plugins: { legend: { labels: { color: '#f8fafc' } } }
        }
    });
}

document.getElementById('runBtn').addEventListener('click', procesarSimulacion);
window.onload = procesarSimulacion;
