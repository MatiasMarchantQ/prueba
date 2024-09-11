const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');

function generateToken(user) {
  return jwt.sign({ user_id: user.user_id, role_id: user.role_id }, jwtSecret, { expiresIn: '1h' });
}

module.exports = generateToken;
