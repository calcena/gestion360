const initLogin = () => {
  sessionStorage.clear();
};

const auth = async (nombre, pass) => {
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
      mensaje.innerHTML = `
                <p class="success">
                    ¡Bienvenido ${response.data.content.nombre}!
                    Redirigiendo...
                </p>`;
      setTimeout(() => {
        window.location.href = "views/main.php";
      }, 1500);
    } else {
      mensaje.innerHTML = `<p class="error">${response.data.error}</p>`;
    }
  } catch (err) {
    console.log("dafsdasdf", err.response.data.error);
    mensaje.innerHTML = `<p class="error">${err.response.data.error}</p>`;
  }
};
