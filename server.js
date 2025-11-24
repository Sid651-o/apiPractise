// server.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "daily_tasks"; // change this in production

const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const pool = require("./db");

const https = require("https");
const fs = require("fs");

const app = express();

const options = {
  key: fs.readFileSync(path.join(__dirname, "taskapp.local-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "taskapp.local.pem"))
};

const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// ✅ FIXED — Serve files correctly
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

function authenticateUser(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    req.userId = decoded.id; // store user id
    next();
  });
}

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, hashedPassword]
    );
    res.json({ message: "User created", user: result.rows[0] });
  } catch (err) {
    res.status(400).json({ message: "Username already taken" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE username=$1", [
    username,
  ]);

  if (result.rows.length === 0)
    return res.status(400).json({ message: "User not found" });

  const user = result.rows[0];

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1d" });

  res.json({ message: "Login success", token });
});



// ----- GET all tasks -----
// app.get("/tasks", async (req, res) => {
//   const result = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
//   res.json(result.rows);
// });

app.get("/tasks", authenticateUser, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM tasks WHERE user_id=$1 ORDER BY id ASC",
    [req.userId]
  );
  res.json(result.rows);
});


// ----- POST new task -----
// app.post("/tasks", async (req, res) => {
//   const { title } = req.body;
//   const result = await pool.query(
//     "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
//     [title]
//   );
//   res.status(201).json(result.rows[0]);
// });

app.post("/tasks", authenticateUser, async (req, res) => {
  const { title } = req.body;
  const result = await pool.query(
    "INSERT INTO tasks (title, user_id) VALUES ($1, $2) RETURNING *",
    [title, req.userId]
  );
  res.status(201).json(result.rows[0]);
});


// ----- PUT -----
app.put("/tasks/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

const result = await pool.query(
  "UPDATE tasks SET title = COALESCE($1, title), completed = COALESCE($2, completed) WHERE id=$3 AND user_id=$4 RETURNING *",
  [title, completed, id, req.userId]
);
  res.json(result.rows[0]);
});


// ----- DELETE -----
app.delete("/tasks/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
await pool.query("DELETE FROM tasks WHERE id=$1 AND user_id=$2", [
  id,
  req.userId,
]);
  res.json({ message: "Task deleted" });
});

//✅ DO NOT auto-open browser — this was causing root folder mismatch
// app.listen(PORT, () => {
//   console.log(`✅ Server running at http://localhost:${PORT}`);
// });

// app.listen(PORT, () => {
//   const url = `http://taskapp.local:${PORT}`;
//   console.log(`\n✅ Server Running!\n`);
//   console.log(`\x1b]8;;${url}\x07Open Task Manager\x1b]8;;\x07\n`);
// });

// const open = (...args) => import("open").then(m => m.default(...args));


// app.listen(PORT, () => {
//   const url = `http://taskapp.local:${PORT}`;
//   console.log(`\n✅ Server Running at ${url}\n`);
//   open(url); // 🚀 Automatically opens in your default browser
// });

const open = (...args) => import("open").then(m => m.default(...args));


// app.listen(PORT, () => {
//   const url = `http://taskapp.local`;
//   console.log(`\n✅ Server Running!\n`);

//   // Clickable link with readable label
//   console.log(`\x1b]8;;${url}\x07🔗 Open Task Manager\x1b]8;;\x07\n`);

//   // Auto open browser
//   open(url);
// });
 
https.createServer(options, app).listen(443, () => {
  console.log("🔐 HTTPS Server running at https://taskapp.local");
  open("https://taskapp.local");
});
