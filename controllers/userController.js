const pool = require('../db');
// const redisClient = require("../redis");
const { hashPassword, validatePassword } = require("../utils/passwordUtils");

exports.getUsers = async (req, res) => {
  try {
    console.time("redis_fetch");
    // const cachedUsers = await redisClient.get("users");
    console.timeEnd("redis_fetch");
    // if (cachedUsers) {
    //   //fetch from redis cache
    //   const users = JSON.parse(cachedUsers);
    //   return res.status(200).json({
    //     success: true,
    //     data: users,
    //     message: "Users fetched from cache"
    //   });
    // }
    console.time("db_fetch");
    const result = await pool.query(
      'SELECT name, email FROM "Users"'
    );
    console.timeEnd("db_fetch");
    // Map database column names to camelCase
    const users = result.rows.map(row => ({
      name: row.name,
      email: row.email,
    }));
    
    // await redisClient.set("users", JSON.stringify(users));
    return res.status(200).json({
      success: true,
      data: users,
      message: "Users fetched from database"
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, email FROM "Users" WHERE id = $1',
      [req.params.id] 
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Map database column names to camelCase
    const user = {
      name: result.rows[0].name,
      email: result.rows[0].email,
    };
    
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM "Users" WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    // Build dynamic UPDATE query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    // Add fields to update (excluding password for now)
    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updateData.name);
    }
    
    if (updateData.email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(updateData.email);
    }
    
    // If password is being updated, validate and hash it
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {  
        return res.status(400).json({ message: passwordValidation.message });
      }
      
      const hashedPassword = await hashPassword(password);
      updateFields.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }
    
    // Add the id parameter
    values.push(req.params.id);
    
    const updateQuery = `
      UPDATE "Users" 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING name, email
    `;
    
    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Map database column names to camelCase
    const updatedUser = {
      name: result.rows[0].name,
      email: result.rows[0].email,
    };
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    // Handle PostgreSQL unique constraint violation (23505 is the error code for unique_violation)
    if (error.code === '23505') {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
