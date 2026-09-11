require('dotenv').config();

const path = require('path');
const express = require('express');

const classesRouter = require('./routes/classes');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/classes', classesRouter);
app.use('/api/chat', chatRouter);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/class/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'class.html'));
});

app.listen(PORT, () => {
  console.log(`Espanol12 server running on port ${PORT}`);
});
