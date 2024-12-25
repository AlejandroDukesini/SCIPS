// Modelo de datos para una tarea
class Task {
    constructor(id, title, description = '', status = 'pending', tags = [], priority = 'medium') {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status; // pending, completed
        this.tags = tags;
        this.priority = priority; // low, medium, high
        this.createdAt = new Date();
        this.completedAt = null;
    }
}

// Gestor principal de tareas
class TaskManager {
    constructor() {
        this.tasks = [];
        this.loadFromLocalStorage();
    }

    // CRUD Operations
    createTask(title, description, tags, priority) {
        const id = Date.now().toString();
        const task = new Task(id, title, description, 'pending', tags, priority);
        this.tasks.push(task);
        this.saveToLocalStorage();
        return task;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToLocalStorage();
    }

    updateTask(id, updates) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            Object.assign(task, updates);
            if (updates.status === 'completed' && !task.completedAt) {
                task.completedAt = new Date();
            }
            this.saveToLocalStorage();
        }
    }

    // Filtros
    filterTasks(criteria) {
        return this.tasks.filter(task => {
            if (criteria.status && task.status !== criteria.status) return false;
            if (criteria.tag && !task.tags.includes(criteria.tag)) return false;
            if (criteria.search) {
                const searchLower = criteria.search.toLowerCase();
                return task.title.toLowerCase().includes(searchLower) ||
                       task.description.toLowerCase().includes(searchLower);
            }
            return true;
        });
    }

    // Persistencia
    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('tasks');
        if (stored) {
            this.tasks = JSON.parse(stored);
            // Convertir las fechas de string a Date
            this.tasks.forEach(task => {
                task.createdAt = new Date(task.createdAt);
                task.completedAt = task.completedAt ? new Date(task.completedAt) : null;
            });
        }
    }
}

// UI Controller
class TaskUI {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTasks();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // Formulario de nueva tarea
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDescription').value;
            const tags = document.getElementById('taskTags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag);
            const priority = document.getElementById('taskPriority').value;

            this.taskManager.createTask(title, description, tags, priority);
            this.renderTasks();
            e.target.reset();
        });

        // Filtros
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
    }

    setupDragAndDrop() {
        const taskList = document.getElementById('taskList');
        
        taskList.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            e.target.classList.add('dragging');
        });

        taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggable = document.querySelector('.dragging');
            const afterElement = this.getDragAfterElement(taskList, e.clientY);
            
            if (afterElement) {
                taskList.insertBefore(draggable, afterElement);
            } else {
                taskList.appendChild(draggable);
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    applyFilters() {
        const status = document.getElementById('statusFilter').value;
        const search = document.getElementById('searchInput').value;
        
        const filteredTasks = this.taskManager.filterTasks({ status, search });
        this.renderTasks(filteredTasks);
    }

    renderTasks(tasks = this.taskManager.tasks) {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item ${task.status} priority-${task.priority}`;
        div.dataset.taskId = task.id;
        div.draggable = true;

        div.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <div class="tags">
                ${task.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="actions">
                <button onclick="handleTaskComplete('${task.id}')">${task.status === 'completed' ? 'Deshacer' : 'Completar'}</button>
                <button onclick="handleTaskDelete('${task.id}')">Eliminar</button>
            </div>
        `;

        return div;
    }
}

// Inicialización
const taskManager = new TaskManager();
const ui = new TaskUI(taskManager);

// Funciones globales para los handlers
function handleTaskComplete(id) {
    const task = taskManager.tasks.find(t => t.id === id);
    taskManager.updateTask(id, { 
        status: task.status === 'completed' ? 'pending' : 'completed' 
    });
    ui.renderTasks();
}

function handleTaskDelete(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        taskManager.deleteTask(id);
        ui.renderTasks();
    }
}