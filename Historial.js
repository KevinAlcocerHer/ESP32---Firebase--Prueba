    // Variables para el historial de datos
    let temperatureHistory = [];
    const MAX_HISTORY_ENTRIES = 288; // 48 horas con entradas cada 10 minutos

    // Referencias a los elementos DOM de la tabla
    const historyTableBody = document.getElementById('history-table-body');
    const refreshHistoryButton = document.getElementById('refresh-history');

    // Función para inicializar y cargar datos del historial
    function initializeHistoryTable() {
    // Referencia a la base de datos de Firebase
    const historyRef = firebase.database().ref('temperatureHistory');
    
    // Cargar datos existentes
    historyRef.orderByChild('timestamp').limitToLast(MAX_HISTORY_ENTRIES).once('value')
        .then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            temperatureHistory = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
            })).sort((a, b) => b.timestamp - a.timestamp); // Ordenar por timestamp descendente
            
            // Renderizar tabla con datos cargados
            renderHistoryTable();
        } else {
            // No hay datos históricos, mostrar mensaje
            historyTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="loading-data">No hay datos históricos disponibles.</td>
            </tr>
            `;
        }
        })
        .catch((error) => {
        console.error("Error al cargar historial:", error);
        historyTableBody.innerHTML = `
            <tr>
            <td colspan="3" class="loading-data">Error al cargar datos históricos. ${error.message}</td>
            </tr>
        `;
        });
        
    // Suscribirse a actualizaciones en tiempo real
    historyRef.orderByChild('timestamp').limitToLast(1).on('child_added', (snapshot) => {
        const newData = {
        id: snapshot.key,
        ...snapshot.val()
        };
        
        // Añadir al principio del array (es el más reciente)
        temperatureHistory.unshift(newData);
        
        // Limitar el tamaño del historial
        if (temperatureHistory.length > MAX_HISTORY_ENTRIES) {
        temperatureHistory = temperatureHistory.slice(0, MAX_HISTORY_ENTRIES);
        }
        
        // Re-renderizar la tabla
        renderHistoryTable();
    });
    }

    // Función para determinar la clase de temperatura
    function getTempClass(temperature) {
    if (temperature <= 15) return 'temp-cold-value';
    if (temperature <= 20) return 'temp-cool-value';
    if (temperature <= 24) return 'temp-mild-value';
    if (temperature <= 28) return 'temp-warm-value';
    if (temperature <= 32) return 'temp-hot-value';
    return 'temp-very-hot-value';
    }

    // Función para formatear la fecha y hora
    function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month} ${hours}:${minutes}`;
    }

    // Función para renderizar la tabla con los datos del historial
    function renderHistoryTable() {
    if (temperatureHistory.length === 0) {
        historyTableBody.innerHTML = `
        <tr>
            <td colspan="3" class="loading-data">No hay datos históricos disponibles.</td>
        </tr>
        `;
        return;
    }
    
    let tableContent = '';
    
    temperatureHistory.forEach((entry) => {
        const tempClass = getTempClass(entry.temperature);
        tableContent += `
        <tr>
            <td>${formatDateTime(entry.timestamp)}</td>
            <td class="${tempClass}">${entry.temperature.toFixed(1)} °C</td>
            <td>${entry.humidity.toFixed(1)} %</td>
        </tr>
        `;
    });
    
    historyTableBody.innerHTML = tableContent;
    }

    // Función para actualizar un nuevo registro en el historial
    function updateHistoryRecord() {
    // Solo guardar datos cada 10 minutos para no sobrecargar la BD
    const currentTemp = parseFloat(tempValue.textContent);
    const currentHumidity = parseFloat(humidityValue.textContent);
    const now = Date.now();
    
    // Verificar si el último registro tiene menos de 10 minutos
    if (temperatureHistory.length > 0) {
        const lastRecord = temperatureHistory[0];
        const timeDiff = now - lastRecord.timestamp;
        const tenMinutesInMs = 10 * 60 * 1000;
        
        if (timeDiff < tenMinutesInMs) {
        console.log("Saltando registro de historial - menos de 10 minutos desde el último");
        return;
        }
    }
    
    // Crear nuevo registro
    const newRecord = {
        temperature: currentTemp,
        humidity: currentHumidity,
        timestamp: now
    };
    
    // Guardar en Firebase
    const historyRef = firebase.database().ref('temperatureHistory');
    historyRef.push(newRecord)
        .then(() => {
        console.log("Registro guardado en historial");
        })
        .catch((error) => {
        console.error("Error al guardar registro en historial:", error);
        });
    }

    // Función para borrar registros antiguos (mantener solo 48 horas)
    function cleanupOldRecords() {
    const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);
    
    // Referencia a registros antiguos
    const historyRef = firebase.database().ref('temperatureHistory');
    const oldRecordsQuery = historyRef.orderByChild('timestamp').endAt(fortyEightHoursAgo);
    
    // Obtener y eliminar registros antiguos
    oldRecordsQuery.once('value')
        .then((snapshot) => {
        if (snapshot.exists()) {
            const updates = {};
            snapshot.forEach((childSnapshot) => {
            updates[childSnapshot.key] = null;
            });
            
            // Aplicar eliminaciones
            historyRef.update(updates)
            .then(() => {
                console.log("Registros antiguos eliminados");
            })
            .catch((error) => {
                console.error("Error al eliminar registros antiguos:", error);
            });
        }
        })
        .catch((error) => {
        console.error("Error al consultar registros antiguos:", error);
        });
    }

    // Event listeners
    refreshHistoryButton.addEventListener('click', function() {
    // Animación al botón
    const refreshIcon = this.querySelector('.refresh-icon');
    refreshIcon.style.animation = 'spin 1s linear';
    
    // Recargar datos
    initializeHistoryTable();
    
    // Quitar animación después de un tiempo
    setTimeout(() => {
        refreshIcon.style.animation = '';
    }, 1000);
    });

    exportHistoryButton.addEventListener('click', exportHistoryToCSV);

    // Inicialización
    document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la tabla después de un breve retraso para permitir que Firebase se cargue
    setTimeout(() => {
        initializeHistoryTable();
    }, 2000);
    
    // Modificar la función updateCurrentValues para actualizar el historial
    const originalUpdateCurrentValues = updateCurrentValues;
    updateCurrentValues = function(temp, humidity, status) {
        originalUpdateCurrentValues(temp, humidity, status);
        
        // Actualizar historial con nueva lectura
        updateHistoryRecord();
    };
    
    // Programar limpieza de registros antiguos (cada hora)
    setInterval(cleanupOldRecords, 60 * 60 * 1000);
    });