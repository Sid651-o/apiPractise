const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");

const API_URL = "http://localhost:3000/tasks";

// Add task when the Add button is clicked
addBtn.addEventListener("click", addTask);

// Add task when Enter key is pressed
taskInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // prevents accidental form submit or page refresh
    addTask();
  }
});


async function loadTasks() {
  const res = await fetch(API_URL);
  const tasks = await res.json();
  taskList.innerHTML = "";
  tasks.forEach((t) => addTaskToUI(t));
}

function addTaskToUI(task) {
  const li = document.createElement("li");
  li.innerHTML = `
    <span class="${task.completed ? 'done' : ''}" onclick="toggleTask(${task.id}, ${!task.completed})">${task.title}</span>
    <button onclick="deleteTask(${task.id})">🗑</button>
  `;
  taskList.appendChild(li);
}

// ✅ Unified addTask function (used by both click & Enter)
async function addTask() {
  const title = taskInput.value.trim();
  if (!title) return;
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  taskInput.value = "";
  loadTasks();
}


async function toggleTask(id, completed) {
  const res = await fetch(`${API_URL}/${id}`);
  const task = await res.json();

  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: task.title, completed }),
  });
  loadTasks();
}

async function deleteTask(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  loadTasks();
}

loadTasks();
