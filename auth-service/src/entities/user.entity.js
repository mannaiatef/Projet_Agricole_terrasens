/**
 * User Entity
 * Represents the structure of a user in the application
 */
class User {
  constructor(id, name, email, password, role, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role || 'farmer';
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Convert user object to JSON (without sensitive data)
   */
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
