const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', authMiddleware.authenticate, authMiddleware.isAdmin, userController.register);
router.get('/', authMiddleware.authenticate, authMiddleware.isAdmin, userController.getAllUsers);
router.put('/:id', authMiddleware.authenticate, userController.updateUser);

module.exports = router;