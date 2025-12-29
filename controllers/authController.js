const jwt = require("jsonwebtoken");
const pool = require("../db");
const { hashPassword, comparePassword, validatePassword } = require("../utils/passwordUtils");
// const redisClient = require("../redis");
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Generate JWT
const generateToken = (user) => {
    return jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  };
  
exports.login = async (req, res) => {
    console.log("Logging in user");
    try {
      const { email, password } = req.body;
      console.log(email, password);
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Query user from PostgreSQL using raw SQL
      const result = await pool.query(
        'SELECT id, name, email, password FROM "Users" WHERE email = $1',
        [email]
      );
      if (result.rows.length === 0) {
        // Don't reveal if user exists or not for security
        return res.status(400).json({ message: "Invalid email or password" });
      }
      
      const user = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        password: result.rows[0].password,
      };
      
      const isPasswordValid = await comparePassword(password, user.password);
      console.log("isPasswordValid==========", isPasswordValid);
      // if (!isPasswordValid) {
      //   return res.status(400).json({ message: "Invalid password" });
      // }
    
      // const token = generateToken(user);
      res.json({ 
        // token, 
        user: { 
          id: user.id,
          name: user.name, 
          email: user.email, 
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
exports.register = async (req, res) => {
    console.log("Registering user");
    try {
      // Check if user already exists in redis cache
    
      // const cachedUsers = await redisClient.get("users");
      // if (cachedUsers) {
      //   return res.status(400).json({ message: "User already exists" });
      // }
      const { name, email, password } = req.body;
      
      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }
      
      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }
      
      // Check if user already exists using raw SQL
      const existingUserResult = await pool.query(
        'SELECT email FROM "Users" WHERE email = $1',
        [email]
      );
      
      if (existingUserResult.rows.length > 0) {
        return res.status(400).json({ message: "Users already exists" });
      }
      
      // Hash password before storing
      const hashedPassword = await hashPassword(password);

      const insertResult = await pool.query(
        'INSERT INTO "Users" (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, hashedPassword]
      );
      const user = {
        name: insertResult.rows[0].name,
        email: insertResult.rows[0].email,
        id: insertResult.rows[0].id,
      };
      const newUser = insertResult.rows[0];

    // 2️⃣ Update Redis cache
    // const cachedUsers = await redisClient.get("users");

    // if (cachedUsers) {
    //   const users = JSON.parse(cachedUsers);
    //   users.push(newUser);
    //     // await redisClient.setEx(
    //     //   "users",
    //     //   60,
    //     //   JSON.stringify(users)
    //     // );
    // }
      res.json(user);
    } catch (error) {
      console.error("Registration error:", error);
      // Handle PostgreSQL unique constraint violation (23505 is the error code for unique_violation)
      if (error.code === '23505') {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  };

  