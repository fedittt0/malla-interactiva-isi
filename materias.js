const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.all('SELECT * FROM materias', (err, rows) => {
    if (err) return res.status(500).send(err);
    rows.forEach(m => {
      m.correlativas_cursado = JSON.parse(m.correlativas_cursado || '[]');
      m.correlativas_final = JSON.parse(m.correlativas_final || '[]');
    });
    res.json(rows);
  });
});

router.put('/:id', (req, res) => {
  const { cursada, aprobada } = req.body;
  db.run(
    'UPDATE materias SET cursada = ?, aprobada = ? WHERE id = ?',
    [cursada ? 1 : 0, aprobada ? 1 : 0, req.params.id],
    function (err) {
      if (err) return res.status(500).send(err);
      res.json({ updated: true });
    }
  );
});

router.post('/seed', (req, res) => {
  const materias = req.body;
  const stmt = db.prepare(`
    INSERT INTO materias (
      codigo, nombre, cursada, aprobada,
      correlativas_cursado, correlativas_final,
      año, cuatrimestre
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  materias.forEach(m =>
    stmt.run(
      m.codigo,
      m.nombre,
      m.cursada ? 1 : 0,
      m.aprobada ? 1 : 0,
      JSON.stringify(m.correlativas_cursado || []),
      JSON.stringify(m.correlativas_final || []),
      m.año,
      m.cuatrimestre
    )
  );
  stmt.finalize();
  res.send('Seed cargado');
});

module.exports = router;