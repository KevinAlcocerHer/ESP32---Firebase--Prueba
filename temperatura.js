const firebaseConfig = {
  apiKey: "AIzaSyA6L6vcWsQcaucQTjmz7svKrCo1t0L-M6c",
  authDomain: "esp32-93fbb.firebaseapp.com",
  databaseURL: "https://esp32-93fbb-default-rtdb.firebaseio.com",
  projectId: "esp32-93fbb",
  storageBucket: "esp32-93fbb.firebasestorage.app",
  messagingSenderId: "623403559263",
  appId: "1:623403559263:web:afdd3dca5dddf9d6346eea",
  measurementId: "G-XWZK0QF50D"
};

let telegramConfig = {
  active: false,
  tempThreshold: 30,
  cooldown: 10, // valor numérico
  cooldownUnit: 'minutes', // 'seconds' o 'minutes'
  recipientName: '',
  chatId: '',
  botToken: '',
  lastAlert: null,
  lastCheck: null
};

// Elementos del DOM
const tempValue = document.getElementById('temp-value');
const humidityValue = document.getElementById('humidity-value');
const lastUpdate = document.getElementById('last-update');
const statusIndicator = document.getElementById('status-indicator');
const loadingElement = document.getElementById('loading');
const dashboardContent = document.getElementById('dashboard-content');
const errorMessage = document.getElementById('error-message');
const tempDescriptor = document.getElementById('temp-descriptor');
const tempIcon = document.getElementById('temp-icon');
const bodyElement = document.body;
const checkbox = document.getElementById('checkbox');
const connectionIndicator = document.getElementById('connection-indicator');
const connectionText = document.getElementById('connection-text');
const minTempElement = document.getElementById('min-temp');
const maxTempElement = document.getElementById('max-temp');
const resetMinMaxButton = document.getElementById('reset-min-max');
const telegramActiveSwitch = document.getElementById('telegram-active');
const tempThresholdInput = document.getElementById('temp-threshold');
const alertCooldownInput = document.getElementById('alert-cooldown');
const cooldownUnitSelect = document.getElementById('cooldown-unit');
const recipientNameInput = document.getElementById('recipient-name');
const chatIdInput = document.getElementById('chat-id');
const botTokenInput = document.getElementById('bot-token');
const saveConfigButton = document.getElementById('save-telegram-config');
const testTelegramButton = document.getElementById('test-telegram');
const telegramStatusText = document.getElementById('telegram-status-text');
const alertStatusElement = document.getElementById('alert-status');
const lastAlertTimeElement = document.getElementById('last-alert-time');
const lastCheckTimeElement = document.getElementById('last-check-time');
const nextCheckTimeElement = document.getElementById('next-check-time');
const alertHistoryContainer = document.getElementById('alert-history-container');   

// Variables para almacenar datos históricos y temperaturas extremas
let historicalData = {
  timestamps: [],
  temperatures: [],
  humidities: []
};

// Variables para almacenar temperaturas máximas y mínimas
let minTemp = Infinity;
let maxTemp = -Infinity;

// Función para actualizar los valores de temperatura máxima y mínima
function updateMinMaxTemps(currentTemp) {
  // Convertir a número para asegurar comparación correcta
  const temp = parseFloat(currentTemp);
  
  // Actualizar temperatura mínima si es necesario
  if (temp < minTemp) {
    minTemp = temp;
    // Animación para el cambio
    minTempElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
      minTempElement.style.transform = 'scale(1)';
    }, 500);
  }
  
  // Actualizar temperatura máxima si es necesario
  if (temp > maxTemp) {
    maxTemp = temp;
    // Animación para el cambio
    maxTempElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
      maxTempElement.style.transform = 'scale(1)';
    }, 500);
  }
  
  // Actualizar valores en pantalla
  minTempElement.textContent = minTemp.toFixed(1);
  maxTempElement.textContent = maxTemp.toFixed(1);
}

// Función para reiniciar los valores mínimos y máximos
function resetMinMaxTemps() {
  // Animación para el reinicio
  minTempElement.style.transform = 'scale(0.8)';
  maxTempElement.style.transform = 'scale(0.8)';
  
  setTimeout(() => {
    // Reiniciar a valores actuales
    const currentTemp = parseFloat(tempValue.textContent);
    minTemp = currentTemp;
    maxTemp = currentTemp;
    
    // Actualizar en pantalla
    minTempElement.textContent = minTemp.toFixed(1);
    maxTempElement.textContent = maxTemp.toFixed(1);
    
    // Restaurar tamaño
    minTempElement.style.transform = 'scale(1)';
    maxTempElement.style.transform = 'scale(1)';
  }, 300);
}

// Evento para el botón de reinicio de min/max
resetMinMaxButton.addEventListener('click', resetMinMaxTemps);

// Manejar cambio de modo con localStorage
checkbox.addEventListener('change', function() {
  if (this.checked) {
    bodyElement.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
    
    // Si hay un gráfico inicializado, actualizar el tema
    if (window.sensorChart) {
      updateChartTheme(true);
      window.sensorChart.update();
    }
  } else {
    bodyElement.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
    
    // Si hay un gráfico inicializado, actualizar el tema
    if (window.sensorChart) {
      updateChartTheme(false);
      window.sensorChart.update();
    }
  }
});

// Verificar preferencia guardada al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('darkMode') === 'enabled') {
    bodyElement.classList.add('dark-mode');
    checkbox.checked = true;
    
    // Si hay un gráfico inicializado, actualizar el tema
    if (window.sensorChart) {
      updateChartTheme(true);
      window.sensorChart.update();
    }
  }
});

// Función para actualizar el tema del gráfico
function updateChartTheme(darkMode) {
  // Actualizar la configuración del tema del gráfico
  if (window.sensorChart) {
    const chartOptions = window.sensorChart.options;
    
    // Colores de texto
    const textColor = darkMode ? '#f0f0f0' : '#666';
    const gridColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Actualizar colores
    chartOptions.scales.x.ticks.color = textColor;
    chartOptions.scales.x.title.color = textColor;
    chartOptions.scales.y.ticks.color = textColor;
    chartOptions.scales.y.title.color = textColor;
    chartOptions.scales.y1.ticks.color = textColor;
    chartOptions.scales.y1.title.color = textColor;
    chartOptions.scales.x.grid.color = gridColor;
    chartOptions.scales.y.grid.color = gridColor;
    chartOptions.scales.y1.grid.color = gridColor;
    chartOptions.plugins.legend.labels.color = textColor;
  }
}

// Función para actualizar el estado de conexión
function updateConnectionStatus(status) {
  connectionIndicator.className = 'connection-indicator';
  
  switch(status) {
    case 'online':
      connectionIndicator.classList.add('connection-online');
      connectionText.textContent = 'Conectado a Firebase';
      break;
    case 'offline':
      connectionIndicator.classList.add('connection-offline');
      connectionText.textContent = 'Desconectado de Firebase';
      break;
    default:
      connectionIndicator.classList.add('connection-waiting');
      connectionText.textContent = 'Verificando conexión...';
  }
}

// Función para formatear la fecha
function formatDate(date) {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Función para actualizar el indicador de estado
function updateStatusIndicator(status) {
  statusIndicator.textContent = `Estado: ${status}`;
  statusIndicator.className = 'status-indicator';
  
  if (status === 'OK') {
    statusIndicator.classList.add('status-ok');
  } else if (status === 'WARNING') {
    statusIndicator.classList.add('status-warning');
  } else {
    statusIndicator.classList.add('status-error');
  }
}

// Función para actualizar el estilo basado en la temperatura
function updateTemperatureStyle(temperature) {
  // Remover todas las clases de temperatura
  bodyElement.classList.remove('temp-cold', 'temp-cool', 'temp-mild', 'temp-warm', 'temp-hot', 'temp-very-hot');
  tempDescriptor.classList.remove('temp-cold-text', 'temp-mild-text', 'temp-warm-text', 'temp-hot-text');
  
  // Determinar clase y descripción según rango de temperatura
  let tempClass = '';
  let tempTextClass = '';
  let description = '';
  let iconEmoji = '';
  
  if (temperature <= 15) {
    tempClass = 'temp-cold';
    tempTextClass = 'temp-cold-text';
    description = 'Muy frío';
    iconEmoji = '❄️';
  } else if (temperature <= 20) {
    tempClass = 'temp-cool';
    tempTextClass = 'temp-cold-text';
    description = 'Frío';
    iconEmoji = '🧊';
  } else if (temperature <= 24) {
    tempClass = 'temp-mild';
    tempTextClass = 'temp-mild-text';
    description = 'Fresco';
    iconEmoji = '🌤️';
  } else if (temperature <= 28) {
    tempClass = 'temp-warm';
    tempTextClass = 'temp-mild-text';
    description = 'Templado';
    iconEmoji = '☀️';
  } else if (temperature <= 32) {
    tempClass = 'temp-hot';
    tempTextClass = 'temp-warm-text';
    description = 'Caluroso';
    iconEmoji = '🔥';
  } else {
    tempClass = 'temp-very-hot';
    tempTextClass = 'temp-hot-text';
    description = 'Muy caluroso';
    iconEmoji = '🔥🔥';
  }
  
  // Aplicar clases con animación
  bodyElement.classList.add(tempClass);
  
  // Animación suave para el cambio de clase del descriptor
  tempDescriptor.style.opacity = 0;
  setTimeout(() => {
    tempDescriptor.classList.add(tempTextClass);
    tempDescriptor.textContent = description;
    tempDescriptor.style.opacity = 1;
  }, 300);
  
  // Animación para el cambio de icono
  tempIcon.style.transform = 'scale(0)';
  setTimeout(() => {
    tempIcon.textContent = iconEmoji;
    tempIcon.style.transform = 'scale(1)';
  }, 300);
}

// Función para actualizar los valores actuales
function updateCurrentValues(temp, humidity, status) {
  // Animaciones para los cambios de valor
  tempValue.style.transform = 'scale(0.8)';
  humidityValue.style.transform = 'scale(0.8)';
  
  setTimeout(() => {
    tempValue.textContent = temp.toFixed(1);
    humidityValue.textContent = humidity.toFixed(1);
    
    tempValue.style.transform = 'scale(1)';
    humidityValue.style.transform = 'scale(1)';
    
    updateStatusIndicator(status || 'OK');
    updateTemperatureStyle(temp);
    
    // Actualizar valores min/max
    updateMinMaxTemps(temp);
    
    const date = new Date();
    lastUpdate.textContent = `Última actualización: ${formatDate(date)}`;
  }, 300);
}

// Función para actualizar el tiempo de última verificación
function updateLastCheckTime() {
  const now = new Date();
  telegramConfig.lastCheck = now.toISOString();
  
  // Actualizar solo el campo lastCheck en Firebase
  firebase.database().ref('telegramConfig/lastCheck').set(telegramConfig.lastCheck)
    .catch(error => {
      console.error("Error al actualizar lastCheck:", error);
    });
}

// Función para actualizar el tiempo de última alerta
function updateLastAlertTime() {
  const now = new Date();
  telegramConfig.lastAlert = now.toISOString();
  
  // Actualizar solo el campo lastAlert en Firebase
  firebase.database().ref('telegramConfig/lastAlert').set(telegramConfig.lastAlert)
    .catch(error => {
      console.error("Error al actualizar lastAlert:", error);
    });
}

// Función para cargar la configuración desde Firebase
function loadTelegramConfig() {
  // Referencia a la configuración de Telegram en Firebase
  const telegramConfigRef = firebase.database().ref('telegramConfig');
  
  // Obtener la configuración
  telegramConfigRef.once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        const savedConfig = snapshot.val();
        telegramConfig = { ...telegramConfig, ...savedConfig };
        
        // Compatibilidad con configuraciones antiguas
        if (savedConfig.intervalUnit && !savedConfig.cooldownUnit) {
          telegramConfig.cooldownUnit = savedConfig.intervalUnit;
        }
        if (savedConfig.checkInterval && !savedConfig.cooldown) {
          telegramConfig.cooldown = savedConfig.checkInterval;
        }
        
        // Actualizar UI con la configuración cargada
        telegramActiveSwitch.checked = telegramConfig.active;
        tempThresholdInput.value = telegramConfig.tempThreshold;
        alertCooldownInput.value = telegramConfig.cooldown;
        
        // Usar cooldownUnit si existe, sino usar intervalUnit para compatibilidad
        if (telegramConfig.cooldownUnit) {
          cooldownUnitSelect.value = telegramConfig.cooldownUnit;
        } else if (telegramConfig.intervalUnit) {
          cooldownUnitSelect.value = telegramConfig.intervalUnit;
        }
        
        recipientNameInput.value = telegramConfig.recipientName;
        chatIdInput.value = telegramConfig.chatId;
        botTokenInput.value = telegramConfig.botToken;
        
        updateTelegramStatus();
      }
    })
    .catch((error) => {
      console.error("Error al cargar configuración de Firebase:", error);
    });
}

// Configurar listener para cambios en la configuración
function setupTelegramConfigListener() {
  const telegramConfigRef = firebase.database().ref('telegramConfig');
  telegramConfigRef.on('value', (snapshot) => {
    if (snapshot.exists()) {
      const savedConfig = snapshot.val();
      telegramConfig = { ...telegramConfig, ...savedConfig };
      
      // Compatibilidad con configuraciones antiguas
      if (savedConfig.intervalUnit && !savedConfig.cooldownUnit) {
        telegramConfig.cooldownUnit = savedConfig.intervalUnit;
      }
      
      // Actualizar UI solo si los valores han cambiado
      if (telegramActiveSwitch.checked !== telegramConfig.active) {
        telegramActiveSwitch.checked = telegramConfig.active;
      }
      
      if (tempThresholdInput.value != telegramConfig.tempThreshold) {
        tempThresholdInput.value = telegramConfig.tempThreshold;
      }
      
      if (alertCooldownInput.value != telegramConfig.cooldown) {
        alertCooldownInput.value = telegramConfig.cooldown;
      }
      
      if (cooldownUnitSelect.value !== telegramConfig.cooldownUnit) {
        cooldownUnitSelect.value = telegramConfig.cooldownUnit || 'minutes';
      }
      
      if (recipientNameInput.value !== telegramConfig.recipientName) {
        recipientNameInput.value = telegramConfig.recipientName;
      }
      
      if (chatIdInput.value !== telegramConfig.chatId) {
        chatIdInput.value = telegramConfig.chatId;
      }
      
      if (botTokenInput.value !== telegramConfig.botToken) {
        botTokenInput.value = telegramConfig.botToken;
      }
      
      updateTelegramStatus();
    }
  });
}

// Función para guardar la configuración en Firebase
function saveTelegramConfig() {
  // Actualizar objeto de configuración
  telegramConfig.active = document.getElementById('telegram-active').checked;
  telegramConfig.tempThreshold = parseFloat(document.getElementById('temp-threshold').value);
  telegramConfig.cooldown = parseInt(document.getElementById('alert-cooldown').value);
  telegramConfig.cooldownUnit = document.getElementById('cooldown-unit').value;
  telegramConfig.recipientName = document.getElementById('recipient-name').value;
  telegramConfig.chatId = document.getElementById('chat-id').value;
  telegramConfig.botToken = document.getElementById('bot-token').value;
  
  // Compatibilidad con la versión anterior - copiar valores a los campos antiguos
  // para garantizar que el sistema siga funcionando si hay código que depende de ellos
  telegramConfig.checkInterval = telegramConfig.cooldown;
  telegramConfig.intervalUnit = telegramConfig.cooldownUnit;
  
  // Referencia a la configuración en Firebase
  const telegramConfigRef = firebase.database().ref('telegramConfig');
  
  // Guardar en Firebase
  telegramConfigRef.set(telegramConfig)
    .then(() => {
      console.log("Configuración guardada correctamente en Firebase");
      updateTelegramStatus();
      
      // Mostrar confirmación
      alert("¡Configuración guardada correctamente en Firebase!");
    })
    .catch((error) => {
      console.error("Error al guardar configuración en Firebase:", error);
      alert("Error al guardar la configuración. Inténtalo de nuevo.");
    });
}

// Actualizar estado visual de Telegram
function updateTelegramStatus() {
  // Acceder a los elementos directamente con getElementById
  const telegramStatusText = document.getElementById('telegram-status-text');
  const alertStatusElement = document.getElementById('alert-status');
  const lastAlertTimeElement = document.getElementById('last-alert-time');
  const lastCheckTimeElement = document.getElementById('last-check-time');
  const nextCheckTimeElement = document.getElementById('next-check-time');

  if (telegramStatusText) {
    telegramStatusText.textContent = telegramConfig.active ? 'Alertas activadas' : 'Alertas desactivadas';
  }
  
  if (alertStatusElement) {
    alertStatusElement.textContent = telegramConfig.active ? 'Activado' : 'Desactivado';
    alertStatusElement.className = telegramConfig.active ? 'alert-badge alert-badge-active' : 'alert-badge alert-badge-inactive';
  }
  
  if (lastAlertTimeElement) {
    if (telegramConfig.lastAlert) {
      const lastAlertDate = new Date(telegramConfig.lastAlert);
      lastAlertTimeElement.textContent = formatDate(lastAlertDate);
    } else {
      lastAlertTimeElement.textContent = 'Nunca';
    }
  }
  
  if (lastCheckTimeElement) {
    if (telegramConfig.lastCheck) {
      const lastCheckDate = new Date(telegramConfig.lastCheck);
      lastCheckTimeElement.textContent = formatDate(lastCheckDate);
      
      if (nextCheckTimeElement) {
        const nextCheckDate = new Date(lastCheckDate);
        // Calcular la próxima verificación usando la unidad de tiempo entre alertas
        if (telegramConfig.cooldownUnit === 'seconds') {
          nextCheckDate.setSeconds(nextCheckDate.getSeconds() + parseInt(telegramConfig.cooldown));
        } else {
          nextCheckDate.setMinutes(nextCheckDate.getMinutes() + parseInt(telegramConfig.cooldown));
        }
        
        nextCheckTimeElement.textContent = formatDate(nextCheckDate);
      }
    } else {
      lastCheckTimeElement.textContent = 'Nunca';
      if (nextCheckTimeElement) {
        nextCheckTimeElement.textContent = '-';
      }
    }
  }
}

// Enviar mensaje de prueba por Telegram
function sendTestMessage() {
  if (!telegramConfig.chatId || !telegramConfig.botToken) {
    alert("Por favor, primero configura un ID de chat y token de bot válidos.");
    return;
  }
  
  const testTemp = parseFloat(tempValue.textContent);
  sendTelegramAlert(testTemp, true);
}

// Enviar alerta por Telegram
function sendTelegramAlert(temperature, isTest = false) {
  if (!telegramConfig.active && !isTest) return;
  
  // Verificar período de enfriamiento para evitar spam
  const now = new Date();
  if (telegramConfig.lastAlert && !isTest) {
    const lastAlertTime = new Date(telegramConfig.lastAlert);
    
    // Calcular diferencia según la unidad seleccionada
    let diffTime;
    if (telegramConfig.cooldownUnit === 'seconds') {
      diffTime = (now - lastAlertTime) / 1000; // segundos
    } else {
      diffTime = (now - lastAlertTime) / (1000 * 60); // minutos
    }
    
    if (diffTime < telegramConfig.cooldown) {
      const timeLeft = Math.ceil(telegramConfig.cooldown - diffTime);
      const unit = telegramConfig.cooldownUnit === 'seconds' ? 'segundos' : 'minutos';
      console.log(`Alerta en enfriamiento. Próxima alerta disponible en ${timeLeft} ${unit}.`);
      return;
    }
  }
  
  const message = isTest 
    ? `🧪 MENSAJE DE PRUEBA 🧪\nHola ${telegramConfig.recipientName}, la temperatura actual es de ${temperature.toFixed(1)}°C.`
    : `⚠️ ALERTA DE TEMPERATURA ⚠️\nHola ${telegramConfig.recipientName}, la temperatura ha superado el límite establecido (${telegramConfig.tempThreshold}°C).\nTemperatura actual: ${temperature.toFixed(1)}°C.`;
  
  const url = `https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage?chat_id=${telegramConfig.chatId}&text=${encodeURIComponent(message)}`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.ok) {
        console.log("Mensaje enviado con éxito");
        
        // Actualizar último tiempo de alerta en Firebase
        updateLastAlertTime();
        
        // También actualizar el último tiempo de verificación
        updateLastCheckTime();
        
        // Agregar a historial de alertas
        addAlertToHistory(temperature, isTest);
        
      } else {
        console.error("Error al enviar mensaje:", data.description);
        alert(`Error al enviar mensaje: ${data.description}`);
      }
    })
    .catch(error => {
      console.error("Error en la solicitud:", error);
      alert("Error al enviar el mensaje. Verifica tu conexión a internet.");
    });
}

// Agregar alerta al historial
function addAlertToHistory(temperature, isTest) {
  const now = new Date();
  const alertItem = document.createElement('div');
  alertItem.className = 'alert-item slide-enter';
  alertItem.innerHTML = `
    <div>
        ${isTest ? '🧪 Prueba:' : '⚠️ Alerta:'} 
        <span class="alert-item-temp">${temperature.toFixed(1)}°C</span>
    </div>
    <div class="alert-item-time">${formatDate(now)}</div>
    `;
    
    alertHistoryContainer.prepend(alertItem);
    
  // Limitar historial a los últimos 5 elementos
    if (alertHistoryContainer.children.length > 5) {
    alertHistoryContainer.removeChild(alertHistoryContainer.lastChild);
    }
    
  // También guardar el historial en Firebase
    const alertHistoryRef = firebase.database().ref('telegramConfig/alertHistory');
    alertHistoryRef.once('value')
    .then((snapshot) => {
        let history = [];
        if (snapshot.exists()) {
        history = snapshot.val();
        }
        
      // Añadir nueva alerta al principio
        history.unshift({
        timestamp: now.toISOString(),
        temperature: temperature,
        isTest: isTest
      });
      
      // Limitar a los últimos 20 elementos
      if (history.length > 20) {
        history = history.slice(0, 20);
      }
      
      // Guardar en Firebase
      alertHistoryRef.set(history);
    })
    .catch((error) => {
      console.error("Error al guardar historial:", error);
    });
}

// Verificar temperatura para alertas
function checkTemperatureForAlert(temperature) {
  if (!telegramConfig.active) return;
  
  // Verificar si la temperatura supera el umbral
  if (temperature > telegramConfig.tempThreshold) {
    // Actualizar el tiempo de verificación
    updateLastCheckTime();
    
    // Enviar alerta si es necesario
    sendTelegramAlert(temperature);
  }
}

// Event listeners para botones de Telegram
saveConfigButton.addEventListener('click', saveTelegramConfig);
testTelegramButton.addEventListener('click', sendTestMessage);
telegramActiveSwitch.addEventListener('change', function() {
  telegramStatusText.textContent = this.checked ? 'Alertas activadas' : 'Alertas desactivadas';
});

// Inicializar Firebase
try {
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const sensorRef = database.ref('sensor');
  
  // Monitorear el estado de conexión
  const connectedRef = database.ref('.info/connected');
  connectedRef.on('value', (snap) => {
    if (snap.val() === true) {
      updateConnectionStatus('online');
    } else {
      updateConnectionStatus('offline');
    }
  });
  
  // Datos para el gráfico
  const chartData = {
    labels: [],
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: [],
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
        pointRadius: 3
      },
      {
        label: 'Humedad (%)',
        data: [],
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 3
      }
    ]
  };
  
  // Configuración del gráfico
  const chartConfig = {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      stacked: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            usePointStyle: true,
            color: bodyElement.classList.contains('dark-mode') ? '#f0f0f0' : '#666'
          }
        },
        tooltip: {
          backgroundColor: bodyElement.classList.contains('dark-mode') ? 'rgba(30, 30, 42, 0.8)' : 'rgba(0, 0, 0, 0.7)',
          padding: 10,
          cornerRadius: 5,
          animations: {
            properties: ['x', 'y', 'width', 'height', 'caretX', 'caretY'],
            duration: 400
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Tiempo',
            color: bodyElement.classList.contains('dark-mode') ? '#f0f0f0' : '#666'
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 10,
            color: bodyElement.classList.contains('dark-mode') ? '#f0f0f0' : '#666'
          },
          grid: {
            color: bodyElement.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Temperatura (°C)',
            color: bodyElement.classList.contains('dark-mode') ? '#f0f0f0' : '#666'
          },
          min: 0,
          suggestedMax: 40,
          ticks: {
            stepSize: 5,
            color: bodyElement.classList.contains('dark-mode') ? '#f0f0f0' : '#666'
          },
          grid: {
            color: bodyElement.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Humedad (%)',
            color: bodyElement.classList.contains('dark-mode') ? '#f0f0f0' : '#666'
          },
          min: 0,
          max: 100,
          grid: {
            drawOnChartArea: false,
            color: bodyElement.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            stepSize: 10,
            color: bodyElement.classList.contains('dark-mode') ? '#f0f0f0' : '#666'
          }
        },
      }
    },
  };
  
  // Crear el gráfico
  const ctx = document.getElementById('sensorChart').getContext('2d');
  window.sensorChart = new Chart(ctx, chartConfig);
  
  // Función para actualizar el gráfico con nuevos datos
  function updateChartData(timestamp) {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                   now.getMinutes().toString().padStart(2, '0');
    
    // Guardar datos históricos
    historicalData.timestamps.push(timestamp);
    historicalData.temperatures.push(parseFloat(tempValue.textContent));
    historicalData.humidities.push(parseFloat(humidityValue.textContent));
    
    // Limitamos a los últimos 20 puntos de datos para mejor visualización
    if (historicalData.timestamps.length > 20) {
      historicalData.timestamps.shift();
      historicalData.temperatures.shift();
      historicalData.humidities.shift();
    }
    
    // Actualizar datos del gráfico
    chartData.labels = historicalData.timestamps.map(ts => {
      const d = new Date(ts);
      return d.getHours().toString().padStart(2, '0') + ':' + 
            d.getMinutes().toString().padStart(2, '0');
    });
    
    chartData.datasets[0].data = historicalData.temperatures;
    chartData.datasets[1].data = historicalData.humidities;
    
    // Actualizar el gráfico
    window.sensorChart.update();
  }
  
  // Escuchar cambios en tiempo real desde Firebase
  sensorRef.on('value', (snapshot) => {
    const data = snapshot.val();
    
    // Ocultar cargando con animación y mostrar contenido
    loadingElement.style.opacity = 0;
    setTimeout(() => {
      loadingElement.style.display = 'none';
      dashboardContent.style.display = 'block';
      
      // Inicializar valores min/max con el primer valor recibido
      if (minTemp === Infinity && maxTemp === -Infinity && data) {
        minTemp = data.temperature;
        maxTemp = data.temperature;
        minTempElement.textContent = minTemp.toFixed(1);
        maxTempElement.textContent = maxTemp.toFixed(1);
      }
      
      // Agregar animación al mostrar el contenido
      setTimeout(() => {
        dashboardContent.style.opacity = 1;
      }, 100);
    }, 500);
    
    // Actualizar valores actuales
    if (data) {
      updateCurrentValues(data.temperature, data.humidity, data.status);
      updateChartData(Date.now());
    }
  }, (error) => {
    console.error("Error al leer datos:", error);
    loadingElement.style.opacity = 0;
    setTimeout(() => {
      loadingElement.style.display = 'none';
      errorMessage.style.display = 'block';
      updateConnectionStatus('offline');
    }, 500);
  });
  
  // Inicializar con datos simulados hasta recibir datos reales
  // Esto es solo para dar una idea visual al usuario antes de que lleguen datos reales
  for (let i = 0; i < 10; i++) {
    const timestamp = Date.now() - (9 - i) * 60000; // Cada minuto
    const tempValue = 25 + Math.random() * 5;
    const humidityValue = 50 + Math.random() * 10;
    
    historicalData.timestamps.push(timestamp);
    historicalData.temperatures.push(tempValue);
    historicalData.humidities.push(humidityValue);
  }
  
  // Actualizar gráfico con datos simulados
  chartData.labels = historicalData.timestamps.map(ts => {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' + 
          d.getMinutes().toString().padStart(2, '0');
  });
  
  chartData.datasets[0].data = historicalData.temperatures;
  chartData.datasets[1].data = historicalData.humidities;
  
  window.sensorChart.update();
  
  // Función para reiniciar/actualizar el gráfico
  function resetChart() {
    // Añadir animación al botón
    const refreshBtn = document.getElementById('refresh-chart');
    const refreshIcon = refreshBtn.querySelector('.refresh-icon');
    refreshIcon.style.animation = 'spin 1s linear'; // Animar icono de actualización
    
    // Limpiar datos históricos
    historicalData = {
      timestamps: [],
      temperatures: [],
      humidities: []
    };
    
    // Generar nuevos datos de ejemplo (o se podría hacer una nueva consulta a Firebase)
    for (let i = 0; i < 10; i++) {
      const timestamp = Date.now() - (9 - i) * 60000; // Cada minuto
      const tempValue = parseFloat(document.getElementById('temp-value').textContent) + (Math.random() * 2 - 1);
      const humidityValue = parseFloat(document.getElementById('humidity-value').textContent) + (Math.random() * 4 - 2);
      
      historicalData.timestamps.push(timestamp);
      historicalData.temperatures.push(tempValue);
      historicalData.humidities.push(humidityValue);
    }
    
    // Actualizar datos del gráfico
    chartData.labels = historicalData.timestamps.map(ts => {
      const d = new Date(ts);
      return d.getHours().toString().padStart(2, '0') + ':' + 
            d.getMinutes().toString().padStart(2, '0');
    });
    
    chartData.datasets[0].data = historicalData.temperatures;
    chartData.datasets[1].data = historicalData.humidities;
    
    // Actualizar el gráfico con animación
    window.sensorChart.update('active');
    
    // Quitar la animación después de un tiempo
    setTimeout(() => {
      refreshIcon.style.animation = '';
    }, 1000);
  }
  
  // Agregar evento click al botón de actualización
  document.getElementById('refresh-chart').addEventListener('click', resetChart);
  
  // Cargar configuración de Telegram al iniciar
  loadTelegramConfig();
  
  // Configurar listener para cambios en la configuración
  setupTelegramConfigListener();
  
  // Modificar la función updateCurrentValues para verificar alertas
  const originalUpdateCurrentValues = updateCurrentValues;
  updateCurrentValues = function(temp, humidity, status) {
    originalUpdateCurrentValues(temp, humidity, status);
    
    // Verificar temperatura para alertas
    checkTemperatureForAlert(temp);
  };
  
} catch (error) {
  console.error("Error al inicializar Firebase:", error);
  loadingElement.style.opacity = 0;
  setTimeout(() => {
    loadingElement.style.display = 'none';
    errorMessage.style.display = 'block';
    updateConnectionStatus('offline');
  }, 500);
  errorMessage.textContent = "Error al conectar con Firebase: " + error.message;
}
