    // Configuración de Firebase
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

    // Elementos del DOM
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('login-message');
    const bodyElement = document.body;
    const checkbox = document.getElementById('checkbox');

    // Inicializar Firebase
    try {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    
    // Comprobar si ya hay un usuario autenticado
    auth.onAuthStateChanged(function(user) {
        if (user) {
        // Usuario ya está autenticado, redirigir a la página principal
        showMessage('¡Sesión iniciada correctamente! Redireccionando...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        }
    });
    
    // Evento de envío del formulario de login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Desactivar el botón para evitar múltiples envíos
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Iniciando sesión...';
        
        // Intentar iniciar sesión con Firebase
        auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login exitoso
            const user = userCredential.user;
            
            // Guardar información de la sesión en localStorage
            localStorage.setItem('userEmail', user.email);
            
            showMessage('¡Sesión iniciada correctamente! Redireccionando...', 'success');
            
            // Redireccionar a la página principal después de un breve retraso
            setTimeout(() => {
            window.location.href = 'index.html';
            }, 1500);
        })
        .catch((error) => {
            // Error en el login
            submitButton.disabled = false;
            submitButton.textContent = 'Iniciar Sesión';
            
            // Mensajes de error amigables según el código de error
            let errorMessage;
            switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'El formato del correo electrónico no es válido.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Esta cuenta ha sido deshabilitada. Contacta al administrador.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No existe una cuenta con este correo electrónico.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta. Inténtalo de nuevo.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Demasiados intentos fallidos. Inténtalo más tarde.';
                break;
            default:
                errorMessage = `Error al iniciar sesión: ${error.message}`;
            }
            
            showMessage(errorMessage, 'error');
        });
    });
    
    } catch (error) {
    console.error("Error al inicializar Firebase:", error);
    showMessage('Error al conectar con el servicio de autenticación. Inténtalo más tarde.', 'error');
    }

    // Función para mostrar mensajes de éxito o error
    function showMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = `login-message fade-in login-${type}`;
    loginMessage.style.display = 'block';
    }

    // Manejar cambio de modo claro/oscuro con localStorage
    checkbox.addEventListener('change', function() {
    if (this.checked) {
        bodyElement.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        bodyElement.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    }
    });

    // Verificar preferencia guardada al cargar la página
    document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('darkMode') === 'enabled') {
        bodyElement.classList.add('dark-mode');
        checkbox.checked = true;
    }
    });