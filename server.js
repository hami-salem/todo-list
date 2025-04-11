const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

// Create express app
const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  // default username for XAMPP
    password: '',  // default password for XAMPP
    database: 'todoapp'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database!');
});

// API Routes
// Add Task
app.post('/task', (req, res) => {
    const { name, deadline, recurrence } = req.body;
    const query = `INSERT INTO tasks (name, deadline, recurrence) VALUES ('${name}', '${deadline}', '${recurrence}')`;
    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.status(201).send({ id: result.insertId, name, deadline, recurrence });
    });
});

// Get Tasks (including completed and uncompleted)
app.get('/tasks', (req, res) => {
    const query = 'SELECT * FROM tasks ORDER BY completed, deadline';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.json(results);
    });
});

// Mark Task as Completed
app.put('/task/:id/complete', (req, res) => {
    const taskId = req.params.id;
    const query = 'SELECT * FROM tasks WHERE id = ?';
    db.query(query, [taskId], (err, results) => {
        if (err) return res.status(500).send(err.message);
        const task = results[0];
        const streak = task.streak + 1;
        let newDeadline = task.deadline;

        // Adjust deadline based on recurrence type
        if (task.recurrence === 'daily') {
            newDeadline = new Date(new Date(task.deadline).setDate(new Date(task.deadline).getDate() + 1));
        } else if (task.recurrence === 'weekly') {
            newDeadline = new Date(new Date(task.deadline).setDate(new Date(task.deadline).getDate() + 7));
        } else if (task.recurrence === 'monthly') {
            newDeadline = new Date(new Date(task.deadline).setMonth(new Date(task.deadline).getMonth() + 1));
        }

        const updateQuery = `UPDATE tasks SET completed = 1, deadline = ?, streak = ? WHERE id = ?`;
        db.query(updateQuery, [newDeadline, streak, taskId], (err, result) => {
            if (err) return res.status(500).send(err.message);
            res.send({ taskId, streak });
        });
    });
});

// Edit Task
app.put('/task/:id', (req, res) => {
    const taskId = req.params.id;
    const { name, deadline, recurrence } = req.body;
    const query = `UPDATE tasks SET name = ?, deadline = ?, recurrence = ? WHERE id = ?`;
    db.query(query, [name, deadline, recurrence, taskId], (err, result) => {
        if (err) return res.status(500).send(err.message);
        res.send({ taskId, name, deadline, recurrence });
    });
});

// Delete Task
app.delete('/task/:id', (req, res) => {
    const taskId = req.params.id;
    const query = 'DELETE FROM tasks WHERE id = ?';
    db.query(query, [taskId], (err, result) => {
        if (err) return res.status(500).send(err.message);
        res.send({ message: 'Task deleted successfully' });
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
