const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const haversine = require('./utils/haversine');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Add School
app.post('/addSchool', async (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ message: 'Invalid input' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
      [name, address, latitude, longitude]
    );
    res.status(201).json({ message: 'School added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'DB Error', error: err });
  }
});

// List Schools
app.get('/listSchools', async (req, res) => {
  const userLat = parseFloat(req.query.latitude);
  const userLng = parseFloat(req.query.longitude);

  if (isNaN(userLat) || isNaN(userLng)) {
    return res.status(400).json({ message: 'Invalid coordinates' });
  }

  try {
    const [schools] = await db.query('SELECT * FROM schools');

    const sorted = schools.map(school => ({
      ...school,
      distance: haversine(userLat, userLng, school.latitude, school.longitude)
    })).sort((a, b) => a.distance - b.distance);

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching schools', error: err });
  }
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
