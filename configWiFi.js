// Elementos del DOM para la sección WiFi
const wifiStatusElement = document.getElementById('wifi-connection-status');
const wifiIpElement = document.getElementById('wifi-ip');
const wifiModeElement = document.getElementById('wifi-mode');
const wifiSsidElement = document.getElementById('wifi-ssid');
const configWifiBtn = document.getElementById('config-wifi-btn');

// Función para cargar y mostrar la configuración WiFi desde Firebase
function loadWifiConfig() {
  // Referencia a la configuración de red en Firebase
  const networkConfigRef = firebase.database().ref('network');
  
  // Obtener la configuración
  networkConfigRef.once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        const networkData = snapshot.val();
        
        // Actualizar elementos de la UI con los datos de red
        if (wifiIpElement) wifiIpElement.textContent = networkData.ip || "192.168.4.1";
        if (wifiModeElement) wifiModeElement.textContent = networkData.mode || "AP (Access Point)";
        if (wifiSsidElement) wifiSsidElement.textContent = networkData.ssid || "ESP32-Access-Point";
        
        // Actualizar el enlace del botón con la IP correcta
        if (configWifiBtn) {
          const wifiLink = configWifiBtn.querySelector('a');
          if (wifiLink) {
            wifiLink.href = `http://${networkData.ip}/`;
          }
        }
      }
    })
    .catch((error) => {
      console.error("Error al cargar configuración de red desde Firebase:", error);
    });
}

// Configurar listener para cambios en la configuración de red
function setupWifiConfigListener() {
  const networkConfigRef = firebase.database().ref('network');
  networkConfigRef.on('value', (snapshot) => {
    if (snapshot.exists()) {
      const networkData = snapshot.val();
      
      // Actualizar elementos de la UI con los datos de red
      if (wifiIpElement) wifiIpElement.textContent = networkData.ip || "192.168.4.1";
      if (wifiModeElement) wifiModeElement.textContent = networkData.mode || "AP (Access Point)";
      if (wifiSsidElement) wifiSsidElement.textContent = networkData.ssid || "ESP32-Access-Point";
      
      // Actualizar el enlace del botón con la IP correcta
      if (configWifiBtn) {
        const wifiLink = configWifiBtn.querySelector('a');
        if (wifiLink) {
          wifiLink.href = `http://${networkData.ip}/`;
        }
      }
    }
  });
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // Cargar configuración WiFi
  loadWifiConfig();
  
  // Configurar listener para cambios
  setupWifiConfigListener();
});

// Si el DOM ya está cargado, ejecutar de inmediato
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  loadWifiConfig();
  setupWifiConfigListener();
}