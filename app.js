

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const db = new sqlite3.Database('./cricketMatchDetails.db');

app.use(express.json());

// API 1: Get all players
app.get('/players/', (req, res) => {
  db.all('SELECT * FROM player_details', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(rows.map(row => ({ playerId: row.player_id, playerName: row.player_name })));
    }
  });
});


// API 2: Get a specific player by playerId
app.get('/players/:playerId/', (req, res) => {
  const playerId = req.params.playerId;
  db.get('SELECT * FROM player_details WHERE player_id = ?', playerId, (err, row) => {
    if (err) {
      console.error(err.message);
      res.sendStatus(500);
    } else if (row) {
      res.json(row);
    } else {
      res.sendStatus(404);
    }
  });
});

// API 3: Update a specific player by playerId
app.put('/players/:playerId/', (req, res) => {
  const playerId = req.params.playerId;
  const playerName = req.body.playerName;

  db.run('UPDATE player_details SET player_name = ? WHERE player_id = ?', [playerName, playerId], (err) => {
    if (err) {
      console.error(err.message);
      res.sendStatus(500);
    } else {
      res.send('Player Details Updated');
    }
  });
});

// API 4: Get match details by matchId
app.get('/matches/:matchId/', (req, res) => {
  const matchId = req.params.matchId;
  db.get('SELECT * FROM match_details WHERE match_id = ?', matchId, (err, row) => {
    if (err) {
      console.error(err.message);
      res.sendStatus(500);
    } else if (row) {
      res.json(row);
    } else {
      res.sendStatus(404);
    }
  });
});

// API 5: Get all matches of a specific player by playerId
app.get('/players/:playerId/matches', (req, res) => {
  const playerId = req.params.playerId;
  db.all('SELECT * FROM player_match_score JOIN match_details ON player_match_score.match_id = match_details.match_id WHERE player_id = ?', playerId, (err, rows) => {
    if (err) {
      console.error(err.message);
      res.sendStatus(500);
    } else {
      res.json(rows.map(row => ({ matchId: row.match_id, match: row.match, year: row.year })));
    }
  });
});

// API 6: Get all players of a specific match by matchId
app.get('/matches/:matchId/players', (req, res) => {
  const matchId = req.params.matchId;
  db.all(`SELECT * FROM player_match_score JOIN player_details ON player_match_score.player_id = player_details.player_id WHERE match_id = ?`, matchId, (err, rows) => {
    if (err) {
      console.error(err.message);
      res.sendStatus(500);
    } else {
      res.json(rows.map(row => ({ playerId: row.player_id, playerName: row.player_name })));
    }
  });
});

// API 7: Get player statistics by playerId
app.get('/players/:playerId/playerScores', (req, res) => {
  const playerId = req.params.playerId;
  db.get('SELECT player_id, player_name, SUM(score) AS totalScore, SUM(fours) AS totalFours, SUM(sixes) AS totalSixes FROM player_match_score JOIN player_details ON player_match_score.player_id = player_details.player_id WHERE player_match_score.player_id = ? GROUP BY player_match_score.player_id', playerId, (err, row) => {
    if (err) {
      console.error(err.message);
      res.sendStatus(500);
    } else if (row) {
      res.json(row);
    } else {
      res.sendStatus(404);
    }
  });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Close the database connection on app termination
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});

// Export the express instance
module.exports = app;
