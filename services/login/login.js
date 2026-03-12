const initLogin = () => {
    sessionStorage.clear();
    const btn = document.getElementById('btn_acceder');
    const inputUsername = document.getElementById('username');
    const inputPassword = document.getElementById('pass');
    const warningElement = document.getElementById('warn_credentials');

    if (btn) {
        btn.addEventListener('click', () => {
            if (inputUsername && inputPassword) {
                const username = inputUsername.value;
                const password = inputPassword.value;
                auth(username, password);
            }
        });
    }

    // Also allow Enter key to submit
    if (inputPassword) {
        inputPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                btn.click();
            }
        });
    }
};

const auth = async (nombre, pass) => {
    const warningElement = document.getElementById('warn_credentials');
    const data = {
        username: nombre.toLowerCase(),
        pass: pass,
    };
    try {
        const response = await axios.post(
            "api/login/login.php?auth",
            { data },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        if (response.data.success) {
            sessionStorage.setItem("usuario_id", response.data.content.id);
            sessionStorage.setItem("role_id", response.data.content.role_id);
            sessionStorage.setItem("login_parent", true);
            if (warningElement) {
                warningElement.textContent = `¡Bienvenido ${response.data.content.nombre}! Redirigiendo...`;
                warningElement.classList.remove('d-none');
            }
            setTimeout(() => {
                window.location.href = "views/main.php";
            }, 1500);
        } else {
            if (warningElement) {
                warningElement.textContent = response.data.error || 'Error de autenticación';
                warningElement.classList.remove('d-none');
            }
        }
    } catch (err) {
        console.error("Login error:", err);
        if (warningElement) {
            const errorMsg = err.response?.data?.error || 'Error de conexión';
            warningElement.textContent = errorMsg;
            warningElement.classList.remove('d-none');
        }
    }
};

document.addEventListener('DOMContentLoaded', initLogin);
