const fs = require('fs');
const path = require('path');

const CLASSES_DIR = path.join(__dirname, '..', 'data', 'classes');

function getClassIndex() {
  const raw = fs.readFileSync(path.join(CLASSES_DIR, 'index.json'), 'utf8');
  return JSON.parse(raw);
}

function getClassData(classId) {
  const safeId = String(classId).replace(/[^a-z0-9-]/gi, '');
  const filePath = path.join(CLASSES_DIR, `${safeId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

module.exports = { getClassIndex, getClassData };
