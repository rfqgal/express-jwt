const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth');

const NOT_FOUND_MESSAGE = 'Book not found.';
const FORBIDDEN_MESSAGE = 'You only have access to your own book.';

// In-memory book storage (in production, use a database)
const books = [];

/* POST book store - protected route */
router.post('/', verifyToken, function(req, res, next) {
  const bookId = uuidv4() // Generate a unique ID for the book
  
  const store = books.push({
    id: bookId,
    name: req.body.name,
    author: req.body.author,
    userId: req.user.id,
    createdAt: new Date().toLocaleString()
  });
  
  if (store) {
    const book = books.find(b => b.id === bookId);
    
    res.json({
      success: true,
      message: 'Book created successfully.',
      book: {
        id: bookId,
        name: book.name,
        author: book.author,
        createdAt: book.createdAt,
      }
    });
  }
});

/* GET books listing - protected route */
router.get('/', verifyToken, function(req, res, next) {
  const bookList = books
    .filter(book => book.userId === req.user.id) // Only return books of the authenticated user
    .map(book => ({
      id: book.id,
      name: book.name,
      author: book.author,
      createdAt: book.createdAt
    }));
  
  res.json({
    success: true,
    books: bookList
  });
});

/* GET specific book by ID - protected route */
router.get('/:id', verifyToken, function(req, res, next) {
  const bookId = req.params.id;
  const book = books.find(b => b.id === bookId);
  
  if (!book) {
    return res.status(404).json({
      success: false,
      message: NOT_FOUND_MESSAGE
    });
  }
  
  if (book.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: FORBIDDEN_MESSAGE
    });
  }
  
  res.json({
    success: true,
    book: {
      id: book.id,
      name: book.name,
      author: book.author,
      createdAt: book.createdAt
    }
  });
});

/* PUT update book - protected route (only owned book) */
router.put('/:id', verifyToken, function(req, res, next) {
  const { id } = req.params;
  const book = books.find(b => b.id === id);
  
  if (!book) {
    return res.status(404).json({
      success: false,
      message: NOT_FOUND_MESSAGE
    });
  }
  
  if (book.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: FORBIDDEN_MESSAGE
    });
  }
  
  const { name, author } = req.body;
  
  // Update book fields
  if (name) book.name = name;
  if (author) book.author = author;
  
  res.json({
    success: true,
    message: 'Book updated successfully.',
    book: {
      id: book.id,
      name: book.name,
      author: book.author,
      createdAt: book.createdAt
    }
  });
});

/* DELETE book - protected route (only owned book) */
router.delete('/:id', verifyToken, function(req, res, next) {
  const { id } = req.params;
  const book = books.find(b => b.id === id);
  
  if (!book) {
    return res.status(404).json({
      success: false,
      message: NOT_FOUND_MESSAGE
    });
  }
  
  if (req.user.id !== book.userId) {
    return res.status(403).json({
      success: false,
      message: FORBIDDEN_MESSAGE
    });
  }
  
  const bookIndex = books.findIndex(b => b.id === id);
  
  if (bookIndex === -1) {
    return res.status(404).json({
      success: false,
      message: NOT_FOUND_MESSAGE
    });
  }
  
  books.splice(bookIndex, 1);
  
  res.json({
    success: true,
    message: 'Book deleted successfully.'
  });
});

module.exports = router;
