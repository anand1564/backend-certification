const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
const { Schema } = mongoose;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

mongoose
  .connect('mongodb://localhost:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to Mongo!');
  })
  .catch((err) => {
    console.error('Error connecting to Mongo', err);
  });

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  id: String,
});

const exerciseSchema = new Schema({
  username: String,
  exercises: [
    {
      description: String,
      duration: Number,
      date: Date,
    },
  ],
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

async function isUserExists(username) {
  const user = await User.findOne({ username });
  return !!user;
}

async function addUser(username, id) {
  const newUser = new User({
    username,
    id,
  });
  await newUser.save();
  return newUser;
}

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  if (await isUserExists(username)) {
    return res.json({ error: 'Username already taken' });
  } else {
    const id = new ObjectId().toString();
    const newUser = await addUser(username, id);
    return res.json({
      username: newUser.username,
      _id: newUser.id,
    });
  }
});

async function checkById(id) {
  const user = await User.findOne({ id });
  return !!user;
}

async function addExercises(id, description, duration, date) {
  const user = await User.findOne({ id });
  if (user) {
    user.exercises.push({ description, duration, date: new Date(date) });
    await user.save();
    return user;
  }
}

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;
  
  if (!(await checkById(id))) {
    return res.json({ error: 'User not found' });
  } else {
    const updatedUser = await addExercises(id, description, duration, date);
    return res.json({
      _id: id,
      username: updatedUser.username,
      description,
      duration,
      date: new Date(date).toDateString(),
    });
  }
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
