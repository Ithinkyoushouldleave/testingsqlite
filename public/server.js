const path = require("path");
const dbPath = path.resolve("form_data.db");  // Get absolute path of the DB file
console.log("🔍 Using database file:", dbPath);
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 8080; // ✅ Ensure this matches your frontend port

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Connect to SQLite Database
const db = new sqlite3.Database("form_data.db", (err) => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
    } else {
        console.log("✅ Connected to SQLite database!");
    }
});

// ✅ Create Table for Training Follow-Up Form
db.run(`
    CREATE TABLE IF NOT EXISTS training_followups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coach_email TEXT NOT NULL,
        coach_name TEXT NOT NULL,
        player_name TEXT NOT NULL,
        follow_up TEXT NOT NULL,
        lesson_type TEXT,
        coach_comments TEXT,
        warmup TEXT,
        hitting_homework TEXT,
        pitching_homework TEXT,
        fielding_homework TEXT,
        submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);

// ✅ Fetch Distinct Player Names (For Dropdown)
// ✅ Fetch List of Players
app.get("/players", (req, res) => {
    db.all("SELECT DISTINCT player_name FROM training_followups", [], (err, rows) => {
        if (err) {
            console.error("❌ Error fetching players:", err.message);
            res.status(500).json({ message: "Database error" });
        } else {
            const players = rows.map(row => row.player_name);
            res.json(players);
        }
    });
});

// ✅ Fetch Most Recent Submission for a Player
app.get("/player/:name", (req, res) => {
    const playerName = req.params.name;
    
    db.get(
        `SELECT * FROM training_followups 
         WHERE player_name = ? 
         ORDER BY submission_time DESC 
         LIMIT 1`, 
        [playerName], 
        (err, row) => {
            if (err) {
                console.error("❌ Error fetching player data:", err.message);
                res.status(500).json({ message: "Database error" });
            } else if (!row) {
                res.json({ message: "No records found for this player." });
            } else {
                res.json(row);
            }
        }
    );
});


// ✅ Handle Form Submission
app.post("/submit", (req, res) => {
    const {
        coach_email,
        coach_name,
        player_name,
        follow_up,
        lesson_type,
        coach_comments,
        warmup,
        hitting_homework,
        pitching_homework,
        fielding_homework
    } = req.body;

    // ✅ Insert data into database
    db.run(
        `INSERT INTO training_followups (
            coach_email, coach_name, player_name, follow_up, lesson_type,
            coach_comments, warmup, hitting_homework, pitching_homework, fielding_homework
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            coach_email,
            coach_name,
            player_name,
            follow_up,
            lesson_type || "",  // Default to empty string if no lesson type
            coach_comments || "",
            warmup || "New York Empire Baseball Dynamic Warmup",
            hitting_homework || "",
            pitching_homework || "",
            fielding_homework || ""
        ],
        (err) => {
            if (err) {
                console.error("❌ Error inserting data:", err.message);
                res.status(500).json({ message: "Database error" });
            } else {
                console.log("✅ Data inserted successfully!");
                res.json({ message: "Form submitted successfully!" });
            }
        }
    );
});

// ✅ Fetch All Entries (For Testing)
app.get("/entries", (req, res) => {
    db.all("SELECT * FROM training_followups", [], (err, rows) => {
        if (err) {
            console.error("❌ Error fetching data:", err.message);
            res.status(500).json({ message: "Database error" });
        } else {
            res.json(rows);
        }
    });
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
