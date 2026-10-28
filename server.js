const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/libraryDB';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));


const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true
  },
  author: {
    type: String,
    default: 'Unknown',
    trim: true
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  availabilityStatus: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Book = mongoose.model('Book', bookSchema);


app.post('/api/books', async (req, res) => {
  try {
    const { title, author, category, availabilityStatus } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required in the request body.' });
    }

    const newBook = new Book({ title, author, category, availabilityStatus });
    const savedBook = await newBook.save();
    res.status(201).json({ message: 'Book added successfully', book: savedBook });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/books', async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 5;
    if (page < 1) page = 1;
    if (limit < 1) limit = 5;

    const skip = (page - 1) * limit;

    const books = await Book.find().skip(skip).limit(limit);
    const totalRecords = await Book.countDocuments();

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords: totalRecords,
      books: books
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.patch('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { availabilityStatus } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid Book ID format.' });
    }

    if (typeof availabilityStatus !== 'boolean') {
      return res.status(400).json({ error: 'availabilityStatus (true or false) is required in the request body.' });
    }

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { availabilityStatus },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found with the given ID.' });
    }

    res.status(200).json({ message: 'Book availability updated successfully', book: updatedBook });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});