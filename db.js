const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'malla.db'));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS materias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT,
      nombre TEXT,
      cursada INTEGER DEFAULT 0,
      aprobada INTEGER DEFAULT 0,
      correlativas_cursado TEXT,
      correlativas_final TEXT,
      año TEXT,
      cuatrimestre TEXT
    )
  `, (err) => {
    if (err) {
      console.error("Error creating table (might already exist):", err.message);
    } else {
      console.log("Tabla 'materias' creada o verificada.");
    }
  });
});

module.exports = db;