//script.js
// ----------------- DOM Elements -----------------
const toggleListBtn = document.getElementById("toggleListBtn");
const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const logoutBtn = document.getElementById("logoutBtn");

// ----------------- Constants -----------------
const API_URL = "/tasks";
const token = localStorage.getItem("token");

// ----------------- Redirect if not logged in -----------------
if (!token) {
  window.location.href = "login.html";
}

// ----------------- Add Task Events -----------------
addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addTask();
  }
});

//logout button event
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// ----------------- Load Tasks -----------------
async function loadTasks() {
  const res = await fetch(API_URL, {
    headers: { "Authorization": token }
  });

  if (!res.ok) {
    alert("Session expired. Please login again.");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }

  const tasks = await res.json();
  taskList.innerHTML = "";
  tasks.forEach((t) => addTaskToUI(t));
}

// ----------------- Toggle Task List -----------------
let isListVisible = true;

toggleListBtn.addEventListener("click", () => {
  isListVisible = !isListVisible;
  taskList.style.display = isListVisible ? "block" : "none";
  toggleListBtn.textContent = isListVisible ? "Hide Task List" : "Show Task List";
});

// ----------------- Add Task to UI -----------------
function addTaskToUI(task) {
  const li = document.createElement("li");

  li.innerHTML = `
    <span class="${task.completed ? 'done' : ''}">
      ${task.title}
    </span>

    ${
      task.completed
        ? `<span class="status">✅ Completed</span>`
        : `<button onclick="toggleTask(${task.id}, true)">Mark Complete</button>`
    }

    <button onclick="deleteTask(${task.id})">🗑</button>
  `;

  taskList.appendChild(li);
}

// ----------------- Add Task -----------------
async function addTask() {
  const title = taskInput.value.trim();
  if (!title) return;

  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ title })
  });

  taskInput.value = "";
  loadTasks();
}

// ----------------- Mark Complete / Toggle Task -----------------
async function toggleTask(id, completed) {
  const res = await fetch(API_URL, {
    headers: { "Authorization": token }
  });

  const tasks = await res.json();
  const task = tasks.find(t => t.id === id);

  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ title: task.title, completed })
  });

  loadTasks();
}

// ----------------- Delete Task -----------------
async function deleteTask(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: { "Authorization": token }
  });

  loadTasks();
}


// ----------------- Initial Load -----------------
loadTasks();
