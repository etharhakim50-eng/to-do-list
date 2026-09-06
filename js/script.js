const addTaskBtn = document.querySelector("#addTaskBtn");
const deleteAllBtn = document.querySelector("#deleteAllBtn");

const taskModal = document.querySelector("#taskModal");
const closeModalBtn = document.querySelector("#closeModalBtn");
const cancelBtn = document.querySelector("#cancelBtn");

const taskForm = document.querySelector("#taskForm");

const taskName = document.querySelector("#taskName");
const taskDescription = document.querySelector("#taskDescription");

const editingTaskId = document.querySelector("#editingTaskId");

const priorityButtons = document.querySelectorAll(".priority-btn");

const subTaskInput = document.querySelector("#subTaskInput");

const addSubTaskBtn = document.querySelector("#addSubTaskBtn");

const subTasksPreview = document.querySelector("#subTasksPreview");

const tasksContainer = document.querySelector("#tasksContainer");

const emptyState = document.querySelector("#emptyState");

const brainInput = document.querySelector("#brainInput");

const brainAddBtn = document.querySelector("#brainAddBtn");

const levelElement = document.querySelector("#level");

const xpText = document.querySelector("#xpText");

const xpProgress = document.querySelector("#xpProgress");

const streakElement = document.querySelector("#streak");

// ==========================================
// data
// ==========================================

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let xp = Number(localStorage.getItem("xp")) || 0;

let level = Number(localStorage.getItem("level")) || 1;

let streak = Number(localStorage.getItem("streak")) || 0;

let lastActiveDate = localStorage.getItem("lastActiveDate") || "";

let selectedPriority = "Medium";

let modalSubTasks = [];

// ==========================================
// open modal
// ==========================================

function openModal() {
  taskModal.classList.add("show");
}

// ==========================================
// close modal
// ==========================================

function closeModal() {
  taskModal.classList.remove("show");

  resetForm();
}

// ==========================================
// reset form
// ==========================================

function resetForm() {
  taskForm.reset();

  editingTaskId.value = "";

  modalSubTasks = [];

  selectedPriority = "Medium";

  subTasksPreview.innerHTML = "";

  priorityButtons.forEach(function (button) {
    button.classList.remove("selected");

    if (button.dataset.priority === "Medium") {
      button.classList.add("selected");
    }
  });

  document.querySelector("#modalTitle").textContent = "Add Task";
}

// ==========================================
// select priority
// ==========================================

function selectPriority(event) {
  priorityButtons.forEach(function (button) {
    button.classList.remove("selected");
  });

  event.target.classList.add("selected");

  selectedPriority = event.target.dataset.priority;
}

// ==========================================
// add subtask
// ==========================================

function addSubTask() {
  const value = subTaskInput.value.trim();

  if (value === "") {
    return;
  }

  modalSubTasks.push({
    id: Date.now(),

    title: value,

    completed: false,
  });

  subTaskInput.value = "";

  displayModalSubTasks();
}

// ==========================================
// display modal subtasks
// ==========================================

function displayModalSubTasks() {
  subTasksPreview.innerHTML = "";

  modalSubTasks.forEach(function (subTask) {
    const div = document.createElement("div");

    div.classList.add("preview-item");

    div.innerHTML = `

            <span>
                ${subTask.title}
            </span>

            <button
                type="button"
                data-id="${subTask.id}"
                class="remove-preview">

                <i class="fa-solid fa-xmark"></i>

            </button>

        `;

    subTasksPreview.appendChild(div);
  });
}

// ==========================================
// remove modal subtask
// ==========================================

function removeModalSubTask(event) {
  const button = event.target.closest(".remove-preview");

  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);

  modalSubTasks = modalSubTasks.filter(function (subTask) {
    return subTask.id !== id;
  });

  displayModalSubTasks();
}

// ==========================================
// create task
// ==========================================

function createTask(event) {
  event.preventDefault();

  const name = taskName.value.trim();

  const description = taskDescription.value.trim();

  if (name === "") {
    return;
  }

  // If editing

  if (editingTaskId.value !== "") {
    editExistingTask();

    return;
  }

  // Check duplicate

  const today = getToday();

  const duplicate = tasks.some(function (task) {
    return (
      task.name.toLowerCase() === name.toLowerCase() &&
      task.createdDate === today
    );
  });

  if (duplicate) {
    alert("You already have this task today.");

    return;
  }

  const newTask = {
    id: Date.now(),

    name: name,

    description: description,

    priority: selectedPriority,

    subtasks: modalSubTasks,

    completed: false,

    postponed: false,

    createdDate: today,

    started: false,

    startTime: null,

    completedTime: null,

    totalTime: 0,

    xpGiven: false,
  };

  tasks.push(newTask);

  saveTasks();

  displayTasks();

  closeModal();
}

// ==========================================
// display tasks
// ==========================================

function displayTasks() {
  tasksContainer.innerHTML = "";

  if (tasks.length === 0) {
    emptyState.style.display = "block";

    return;
  }

  emptyState.style.display = "none";

  tasks.forEach(function (task) {
    const card = createTaskCard(task);

    tasksContainer.appendChild(card);
  });
}

// ==========================================
// task card
// ==========================================

function createTaskCard(task) {
  const card = document.createElement("article");

  card.classList.add("task-card");

  if (task.completed) {
    card.classList.add("completed");
  }

  let subtasksHTML = "";

  if (task.subtasks.length > 0) {
    subtasksHTML = `

            <div class="subtasks">

                <h4>Sub-tasks</h4>

                ${task.subtasks
                  .map(function (subTask) {
                    return `

                        <label
                            class="subtask ${subTask.completed ? "done" : ""}">

                            <input
                                type="checkbox"

                                data-task-id="${task.id}"

                                data-subtask-id="${subTask.id}"

                                class="subtask-checkbox"

                                ${subTask.completed ? "checked" : ""}

                                ${task.completed ? "disabled" : ""}
                            >

                            <span>
                                ${subTask.title}
                            </span>

                        </label>

                    `;
                  })
                  .join("")}

            </div>

        `;
  }

  let timerText = formatTime(task.totalTime);

  if (task.started && !task.completed) {
    timerText = formatTime(task.totalTime + getCurrentSessionTime(task));
  }

  card.innerHTML = `

        <div class="task-top">

            <div class="task-title">
                ${task.name}
            </div>

            <span class="priority ${task.priority}">
                ${task.priority}
            </span>

        </div>


        ${
          task.description
            ? `
                <p class="task-description">
                    ${task.description}
                </p>
            `
            : ""
        }


        ${subtasksHTML}


        <div class="timer-box">

            <span class="timer">
                ${timerText}
            </span>


            ${
              task.completed
                ? `<span>Completed</span>`
                : `
                    <button
                        class="start-btn"
                        data-id="${task.id}">

                        ${task.started ? "Running..." : "Start"}

                    </button>
                `
            }

        </div>


        ${
          task.completed
            ? `
                <div class="task-xp">

                    +${getTaskXP(task.priority)}
                    XP earned

                </div>


                <div class="task-actions">

                    <button
                        class="delete-btn"
                        data-id="${task.id}">

                        <i class="fa-solid fa-trash"></i>

                        Delete

                    </button>

                </div>
            `
            : `
                <div class="task-actions">

                    <button
                        class="edit-btn"
                        data-id="${task.id}">

                        <i class="fa-solid fa-pen"></i>

                        Edit

                    </button>


                    <button
                        class="complete-btn"
                        data-id="${task.id}">

                        <i class="fa-solid fa-check"></i>

                        Complete

                    </button>


                    <button
                        class="postpone-btn"
                        data-id="${task.id}">

                        <i class="fa-solid fa-calendar-day"></i>

                        Tomorrow

                    </button>


                    <button
                        class="delete-btn"
                        data-id="${task.id}">

                        <i class="fa-solid fa-trash"></i>

                        Delete

                    </button>

                </div>
            `
        }

    `;

  return card;
}

// ==========================================
// start task
// ==========================================

function startTask(event) {
  const button = event.target.closest(".start-btn");

  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);

  const task = tasks.find(function (task) {
    return task.id === id;
  });

  if (!task || task.completed) {
    return;
  }

  if (!task.started) {
    task.started = true;

    task.startTime = Date.now();

    saveTasks();

    displayTasks();
  }
}

// ==========================================
// current session time
// ==========================================

function getCurrentSessionTime(task) {
  if (!task.started || !task.startTime) {
    return 0;
  }

  return Math.floor((Date.now() - task.startTime) / 1000);
}

// ==========================================
// complete task
// ==========================================

function completeTask(event) {
  const button = event.target.closest(".complete-btn");

  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);

  const task = tasks.find(function (task) {
    return task.id === id;
  });

  if (!task || task.completed) {
    return;
  }

  const allSubtasksDone = task.subtasks.every(function (subTask) {
    return subTask.completed;
  });

  if (task.subtasks.length > 0 && !allSubtasksDone) {
    alert("Complete all sub-tasks first.");

    return;
  }

  if (task.started) {
    task.totalTime += getCurrentSessionTime(task);

    task.started = false;

    task.startTime = null;
  }

  task.completed = true;

  task.completedTime = Date.now();

  addXP(task);

  updateStreak();

  saveTasks();

  displayTasks();
}

// ==========================================
// complete subtask
// ==========================================

function completeSubTask(event) {
  if (!event.target.classList.contains("subtask-checkbox")) {
    return;
  }

  const taskId = Number(event.target.dataset.taskId);

  const subTaskId = Number(event.target.dataset.subtaskId);

  const task = tasks.find(function (task) {
    return task.id === taskId;
  });

  if (!task || task.completed) {
    return;
  }

  const subTask = task.subtasks.find(function (subTask) {
    return subTask.id === subTaskId;
  });

  if (!subTask) {
    return;
  }

  subTask.completed = event.target.checked;

  saveTasks();

  displayTasks();
}

// ==========================================
// edit task
// ==========================================

function editTask(event) {
  const button = event.target.closest(".edit-btn");

  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);

  const task = tasks.find(function (task) {
    return task.id === id;
  });

  if (!task || task.completed) {
    return;
  }

  editingTaskId.value = task.id;

  taskName.value = task.name;

  taskDescription.value = task.description;

  selectedPriority = task.priority;

  modalSubTasks = JSON.parse(JSON.stringify(task.subtasks));

  priorityButtons.forEach(function (button) {
    button.classList.remove("selected");

    if (button.dataset.priority === task.priority) {
      button.classList.add("selected");
    }
  });

  displayModalSubTasks();

  document.querySelector("#modalTitle").textContent = "Edit Task";

  openModal();
}

// ==========================================
// edit existing task
// ==========================================

function editExistingTask() {
  const id = Number(editingTaskId.value);

  const task = tasks.find(function (task) {
    return task.id === id;
  });

  if (!task || task.completed) {
    return;
  }

  task.name = taskName.value.trim();

  task.description = taskDescription.value.trim();

  task.priority = selectedPriority;

  task.subtasks = modalSubTasks;

  saveTasks();

  displayTasks();

  closeModal();
}

// ==========================================
// delete task
// ==========================================

function deleteTask(event) {
  const button = event.target.closest(".delete-btn");

  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);

  tasks = tasks.filter(function (task) {
    return task.id !== id;
  });

  saveTasks();

  displayTasks();
}

// ==========================================
// delete all tasks
// ==========================================

function deleteAllTasks() {
  if (tasks.length === 0) {
    return;
  }

  const answer = confirm("Are you sure you want to delete all tasks?");

  if (!answer) {
    return;
  }

  tasks = [];

  saveTasks();

  displayTasks();
}

// ==========================================
// postpone task
// ==========================================

function postponeTask(event) {
  const button = event.target.closest(".postpone-btn");

  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);

  const task = tasks.find(function (task) {
    return task.id === id;
  });

  if (!task || task.completed) {
    return;
  }

  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  task.createdDate = getDateString(tomorrow);

  task.postponed = true;

  saveTasks();

  displayTasks();
}

// ==========================================
// brain dump
// ==========================================

function addBrainDump() {
  /*
        you can enter multiple tasks here then,

        each line becomes a separate task.
    */

  const text = brainInput.value.trim();

  if (text === "") {
    return;
  }

  // split the textarea by lines

  const lines = text.split("\n");

  // remove empty lines

  const cleanLines = lines
    .map(function (line) {
      return line.trim();
    })
    .filter(function (line) {
      return line !== "";
    });

  if (cleanLines.length === 0) {
    return;
  }

  const today = getToday();

  let addedCount = 0;

  cleanLines.forEach(function (line) {
    // Check duplicate

    const duplicate = tasks.some(function (task) {
      return (
        task.name.toLowerCase() === line.toLowerCase() &&
        task.createdDate === today
      );
    });

    if (duplicate) {
      return;
    }

    const brainTask = {
      id: Date.now() + Math.random(),

      name: line,

      description: "",

      priority: "Low",

      subtasks: [],

      completed: false,

      postponed: false,

      createdDate: today,

      started: false,

      startTime: null,

      completedTime: null,

      totalTime: 0,

      xpGiven: false,
    };

    tasks.push(brainTask);

    addedCount++;
  });

  // Clear textarea

  brainInput.value = "";

  saveTasks();

  displayTasks();

}

// ==========================================
// xp value
// ==========================================

function getTaskXP(priority) {
  if (priority === "High") {
    return 50;
  }

  if (priority === "Medium") {
    return 25;
  }

  return 10;
}

// ==========================================
// add XP
// ==========================================

function addXP(task) {
  if (task.xpGiven) {
    return;
  }

  const amount = getTaskXP(task.priority);

  xp += amount;

  task.xpGiven = true;

  updateLevel();

  saveProgress();
}

// ==========================================
// level
// ==========================================

function updateLevel() {
  let requiredXP = level * 100;

  while (xp >= requiredXP) {
    xp -= requiredXP;

    level++;

    requiredXP = level * 100;
  }

  updateProgressUI();
}

// ==========================================
// update xp
// ==========================================

function updateProgressUI() {
  const requiredXP = level * 100;

  levelElement.textContent = level;

  xpText.textContent = `${xp} / ${requiredXP}`;

  const percentage = (xp / requiredXP) * 100;

  xpProgress.style.width = `${percentage}%`;
}

// ==========================================
// streak
// ==========================================

function updateStreak() {
  const today = getToday();

  if (lastActiveDate === today) {
    return;
  }

  if (lastActiveDate === "") {
    streak = 1;
  } else {
    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayString = getDateString(yesterday);

    if (lastActiveDate === yesterdayString) {
      streak++;
    } else {
      streak = 1;
    }
  }

  lastActiveDate = today;

  saveProgress();

  streakElement.textContent = streak;
}

// ==========================================
// save tasks
// ==========================================

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ==========================================
// save progress
// ==========================================

function saveProgress() {
  localStorage.setItem("xp", xp);

  localStorage.setItem("level", level);

  localStorage.setItem("streak", streak);

  localStorage.setItem("lastActiveDate", lastActiveDate);
}

// ==========================================
// load progress
// ==========================================

function loadProgress() {
  levelElement.textContent = level;

  streakElement.textContent = streak;

  updateProgressUI();
}

// ==========================================
// date formatting
// ==========================================

function getDateString(date) {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

function getToday() {
  return getDateString(new Date());
}

// ==========================================
// time formatting
// ==========================================

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor((seconds % 3600) / 60);

  const secs = seconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// ==========================================
// EVENTS
// ==========================================

addTaskBtn.addEventListener("click", openModal);

closeModalBtn.addEventListener("click", closeModal);

cancelBtn.addEventListener("click", closeModal);

taskForm.addEventListener("submit", createTask);

priorityButtons.forEach(function (button) {
  button.addEventListener("click", selectPriority);
});

addSubTaskBtn.addEventListener("click", addSubTask);

subTasksPreview.addEventListener("click", removeModalSubTask);

brainAddBtn.addEventListener("click", addBrainDump);

tasksContainer.addEventListener("click", function (event) {
  startTask(event);

  completeTask(event);

  editTask(event);

  deleteTask(event);

  postponeTask(event);
});

tasksContainer.addEventListener("change", completeSubTask);

deleteAllBtn.addEventListener("click", deleteAllTasks);

// INITIAL LOAD
loadProgress();

displayTasks();
