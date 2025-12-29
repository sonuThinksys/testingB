const pool = require('../postgres');
// const { redisClient, connectRedis } = require('../redis');
const bcrypt = require('bcryptjs');

// Get all users
exports.getUsers = async (req, res) => {
  try {
    // Try cache, but fail soft if Redis is down
    try {
      // await connectRedis();
      // const cachedUsers = redisClient?.isOpen ? await redisClient.get("users") : null;
      // if (cachedUsers) {
      //   res.json({
      //     success: true,
      //     data: JSON.parse(cachedUsers),
      //     message: 'Users fetched from cache'
      //   });
      //   return;
      // }
    } catch (cacheErr) {
      console.warn('Cache unavailable, continuing with DB:', cacheErr.message || cacheErr);
    }
    const limit = parseInt(req.query.limit) || 50;
    const result = await pool.query('SELECT name, email FROM "Users" LIMIT $1', [limit]);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  try {
    console.log("Creating user");
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Check if email already exists
    const existingUser = await pool.query('SELECT email FROM "User" WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const result = await pool.query(
      'INSERT INTO "User" (name, email, password) VALUES ($1, $2, $3) RETURNING name, email',
      [name, email, hashedPassword || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully'
    });
  } catch (err) {
    console.error('Error creating user:', err);
    
    // Handle unique constraint violation
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Create a new card
exports.createCard = async (req, res) => {
  try {
    const { name, cvv, last4 } = req.body;

    // Input validation
    if (!name || !cvv) {
      return res.status(400).json({
        success: false,
        message: 'Name and CVV are required'
      });
    }

    const result = await pool.query(
      'INSERT INTO "Card" (name, cvv, last4) VALUES ($1, $2, $3) RETURNING id, name, last4',
      [name, cvv, last4 || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Card created successfully'
    });
  } catch (err) {
    console.error('Error creating card:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create card',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

