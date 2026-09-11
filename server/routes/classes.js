const express = require('express');
const { getClassIndex, getClassData } = require('../data');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getClassIndex());
});

router.get('/:id', (req, res) => {
  const classData = getClassData(req.params.id);
  if (!classData) {
    return res.status(404).json({ error: 'Class not found or not published yet.' });
  }
  res.json(classData);
});

module.exports = router;
