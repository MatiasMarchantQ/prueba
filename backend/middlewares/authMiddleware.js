const jwt = require('jsonwebtoken');
const Users = require('../models/Users');

exports.authenticate = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = await Users.findByPk(decoded.user_id); 
    
    if (!req.user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid token' });
  }
};
