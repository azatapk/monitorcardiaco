// Registro do Service Worker para conformidade PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado com sucesso:', reg.scope))
            .catch(err => console.log('Falha ao registrar o Service Worker:', err));
    });
}

// Lógica de importação e processamento do arquivo GPX
document.getElementById('gpxFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    document.getElementById('fileName').textContent = file.name;
    const reader = new FileReader();
    
    reader.onload = function(evt) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(evt.target.result, "text/xml");
        
        const trackPoints = xmlDoc.getElementsByTagName("trkpt");
        
        if (trackPoints.length === 0) {
            alert("Nenhum dado de ponto de trajeto encontrado no GPX.");
            return;
        }

        let totalHr = 0;
        let maxHr = 0;
        let hrCount = 0;
        let times = [];

        for (let i = 0; i < trackPoints.length; i++) {
            const pt = trackPoints[i];
            
            // Captura o Tempo
            const timeNode = pt.getElementsByTagName("time")[0];
            if (timeNode) {
                times.push(new Date(timeNode.textContent));
            }

            // Captura os Batimentos Cardíacos tratando namespaces do Zepp
            let hrNode = pt.getElementsByTagName("ns3:hr")[0] || pt.getElementsByTagName("hr")[0];
            if (hrNode) {
                const hrValue = parseInt(hrNode.textContent);
                totalHr += hrValue;
                if (hrValue > maxHr) maxHr = hrValue;
                hrCount++;
            }
        }

        // 1. Cálculo do Tempo Total
        let durationSeconds = 0;
        if (times.length > 1) {
            durationSeconds = Math.abs(times[times.length - 1] - times[0]) / 1000;
        }
        const hours = Math.floor(durationSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((durationSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = Math.floor(durationSeconds % 60).toString().padStart(2, '0');
        
        // 2. Cálculo de Média de Batimentos
        const avgHr = hrCount > 0 ? Math.round(totalHr / hrCount) : 0;

        // 3. Estimativa de Calorias Totais (Fórmula baseada em HR, Idade e Peso padrão)
        let calories = 0;
        if (durationSeconds > 0 && avgHr > 0) {
            const durationMinutes = durationSeconds / 60;
            // Fórmula padrão para testes: [(-55.0969 + (25 anos * 0.2017) + (75kg * 0.1988) + (avgHr * 0.6309)) * min] / 4.184
            calories = ((-55.0969 + (25 * 0.2017) + (75 * 0.1988) + (avgHr * 0.6309)) * durationMinutes) / 4.184;
            calories = Math.max(0, Math.round(calories));
        }

        // Atualização da UI
        document.getElementById('totalTime').textContent = `${hours}:${minutes}:${seconds}`;
        document.getElementById('heartRate').textContent = `${avgHr} / ${maxHr} BPM`;
        document.getElementById('totalCalories').textContent = `${calories} kcal`;
        document.getElementById('resultsBox').style.display = 'block';
    };
    
    reader.readAsText(file);
});

