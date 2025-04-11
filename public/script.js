// Show tasks from API
function fetchTasks() {
    fetch('/tasks')
        .then(response => response.json())
        .then(tasks => {
            // Separate tasks based on completion status and recurrence type
            const uncompletedTasks = tasks.filter(task => !task.completed);
            const completedRecurringTasks = tasks.filter(task => task.completed && task.recurrence !== 'one-time');
            const completedOneTimeTasks = tasks.filter(task => task.completed && task.recurrence === 'one-time');

            // Update the task list (uncompleted tasks)
            const tasksContainer = document.getElementById('tasks-container');
            tasksContainer.innerHTML = '';  // Clear the existing tasks list

            // Display uncompleted recurring tasks and uncompleted one-time tasks
            uncompletedTasks.forEach(task => {
                const taskDate = new Date(task.deadline);
                const now = new Date();

                // Check if the task deadline is overdue
                const isOverdue = taskDate < now.setHours(0, 0, 0, 0); // Only tasks before today (midnight)


                // Add the overdue class if the deadline has passed
                const overdueClass = isOverdue ? 'overdue' : '';

                tasksContainer.innerHTML += `
                    <li class="task">
                        <a class="${overdueClass}">
                        <h2>${formatDeadline(task.deadline)}</h2>
                        <p>${task.name}</p>
                        <button class="check"
                        onclick="completeTask(${task.id})"><i class="fa-solid fa-check"></i></button>
                        <button class="edit"
                        onclick="editTask(${task.id})"><i class="fa-solid fa-pen-nib"></i></button>
                        <button class="delete"
                        onclick="deleteTask(${task.id})"><i class="fa-solid fa-xmark"></i></button>
                        </a>
                    </li>
                `;
            });

            // Display completed recurring tasks at the top with uncompleted tasks
            completedRecurringTasks.forEach(task => {
                const taskDate = new Date(task.deadline);
                const now = new Date();

                // Check if the task deadline is overdue
                const isOverdue = taskDate < now.setHours(0, 0, 0, 0); // Only tasks before today (midnight)


                // Add the overdue class if the deadline has passed
                const overdueClass = isOverdue ? 'overdue' : '';
                
                tasksContainer.innerHTML += `
                    <li class="task">
                        <a class="${overdueClass}">
                        <h2>${formatDeadline(task.deadline)}</h2>
                        <p>${task.name}</p>
                        <p class="streak">${task.streak} in a row!</p>
                        <button class="check"
                        onclick="completeTask(${task.id})"><i class="fa-solid fa-check"></i></button>
                        <button class="edit"
                        onclick="editTask(${task.id})"><i class="fa-solid fa-pen-nib"></i></button>
                        <button class="delete"
                        onclick="deleteTask(${task.id})"><i class="fa-solid fa-xmark"></i></button>
                        </a>
                    </li>
                `;
            });

            // Display completed one-time tasks at the bottom
            const completedTasksContainer = document.getElementById('completed-tasks-container');
            completedTasksContainer.innerHTML = '';  // Clear the completed tasks list

            completedOneTimeTasks.forEach(task => {
                completedTasksContainer.innerHTML += `
                    <div class="task completed">
                        <span>${task.name}</span>
                    </div>
                `;
            });
        });
}

function formatDeadline(deadline) {
    const now = new Date();
    const taskDate = new Date(deadline);

    // If the deadline is today
    if (taskDate.toDateString() === now.toDateString()) {
        return "Today";
    }

    // If the deadline is within 7 days
    const diffTime = taskDate - now; // Difference in milliseconds
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24)); // Convert to days

    if (diffDays < 7 && diffDays > 0) {
        // Get the weekday name (e.g., "Monday")
        const options = { weekday: 'long' };
        return taskDate.toLocaleDateString('en-US', options); // Example: "Monday"
    }

    // If the deadline is 7 or more days away, format as DD.MM.YYYY
    const day = String(taskDate.getDate()).padStart(2, '0');
    const month = String(taskDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = taskDate.getFullYear();
    
    return `${day}.${month}.${year}`; // Example: "04.01.2025"
}



fetchTasks();

function showAddTaskForm() {
    document.getElementById('add-task-form').classList.remove('hidden');
}

function hideAddTaskForm() {
    document.getElementById('add-task-form').classList.add('hidden');
}

function showEditTaskForm() {
    document.getElementById('edit-task-form').classList.remove('hidden');
}

function hideEditTaskForm() {
    document.getElementById('edit-task-form').classList.add('hidden');
    document.getElementById('add-task-btn').classList.remove('hidden');
}

function addTask() {
    const name = document.getElementById('add-task-name').value;
    const deadline = document.getElementById('add-task-deadline').value;
    const recurrence = document.getElementById('add-task-recurrence').value;

    fetch('/task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, deadline, recurrence }),
    })
    .then(response => response.json())
    .then(() => {
        fetchTasks();
        hideAddTaskForm();
    });
}

function completeTask(taskId) {
    fetch(`/task/${taskId}/complete`, {
        method: 'PUT',
    })
    .then(response => response.json())
    .then(() => fetchTasks());
}

function deleteTask(taskId) {
    fetch(`/task/${taskId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(() => fetchTasks());
}

function formatDateToLocalISOString(date) {
    const localDate = new Date(date);
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset()); // Adjust to local time
    return localDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

function editTask(taskId) {
    // Fetch the task details by ID
    fetch(`/tasks`)
        .then(response => response.json())
        .then(tasks => {
            // Find the task with the given taskId
            const task = tasks.find(task => task.id === taskId);

            if (task) {
                // Pre-fill the form with the current task values
                document.getElementById('edit-task-name').value = task.name;
                document.getElementById('edit-task-deadline').value = formatDateToLocalISOString(task.deadline);
                document.getElementById('edit-task-recurrence').value = task.recurrence;

                console.log(task.deadline); 

                // Show the form
                document.getElementById('edit-task-form').classList.remove('hidden');
                document.getElementById('add-task-btn').classList.add('hidden');
                const editButton = document.querySelector('#edit-task-form button');

                // When the form is submitted, update the task
                editButton.onclick = function () {
                    updateTask(taskId);
                };
            }
        });
}

function updateTask(taskId) {
    // Get the updated values from the form
    const name = document.getElementById('edit-task-name').value;
    const deadline = document.getElementById('edit-task-deadline').value;
    const recurrence = document.getElementById('edit-task-recurrence').value;

    // Send the updated task data to the server
    fetch(`/task/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, deadline, recurrence }),
    })
    .then(response => response.json())
    .then(() => {
        // Refresh the task list and hide the form
        fetchTasks();
        hideEditTaskForm();

        // Restore the "Add Task" button visibility
        document.getElementById('add-task-btn').classList.remove('hidden');
    });
}

