const { pool } = require('../config/db');
const User = require('../entities/user.entity');

class UserRepository {
  /**
   * Create a new user
   * @param {User} user - User object
   * @returns {Promise<User>} - Created user with ID
   */
  async create(user) {
    try {
      const query = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
      const [result] = await pool.execute(query, [
        user.name,
        user.email,
        user.password,
        user.role,
      ]);
      user.id = result.insertId;
      return user;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} - User object or null
   */
  async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = ?';
      const [rows] = await pool.execute(query, [email]);
      
      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return new User(
        row.id,
        row.name,
        row.email,
        row.password,
        row.role,
        row.created_at,
        row.updated_at
      );
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<User|null>} - User object or null
   */
  async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return new User(
        row.id,
        row.name,
        row.email,
        row.password,
        row.role,
        row.created_at,
        row.updated_at
      );
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Partial<User>} updates - Fields to update
   * @returns {Promise<User>} - Updated user
   */
  async update(id, updates) {
    try {
      const allowedFields = ['name', 'email', 'password', 'role'];
      const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
      
      if (fields.length === 0) {
        return this.findById(id);
      }

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field]);
      values.push(id);

      const query = `UPDATE users SET ${setClause} WHERE id = ?`;
      await pool.execute(query, values);

      return this.findById(id);
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} - Success flag
   */
  async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  /**
   * Find all users
   * @returns {Promise<User[]>} - Array of users
   */
  async findAll() {
    try {
      const query = 'SELECT * FROM users';
      const [rows] = await pool.execute(query);
      
      return rows.map(row => 
        new User(
          row.id,
          row.name,
          row.email,
          row.password,
          row.role,
          row.created_at,
          row.updated_at
        )
      );
    } catch (error) {
      throw new Error(`Error finding all users: ${error.message}`);
    }
  }
}

module.exports = new UserRepository();
