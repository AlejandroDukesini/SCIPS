//Función del botón 
function mostrarContenido() {
    const formular = document.getElementById('taskForm');
    formular.classList.remove('no-show');
}
document.getElementById('crearTarea').addEventListener('click', mostrarContenido);
//
