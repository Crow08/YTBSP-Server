/* eslint-disable no-unused-vars, class-methods-use-this */

/**
 * Interface Class for DB Implementations.
 * @interface
 * @Category Service
 */
class DBService {

  /**
   * Establish a connection to the DB.
   * If a connection is already established disconnect first.
   * @abstract
   * @returns {Promise} - Promise to be resolved when connection is established, rejected if an error occurs.
   */
  connectDB() {
    return new Promise((resolve, reject) => {
      reject(new Error("No implementation Found!"));
    });
  }

  /**
   * Check if connection to the DB is established.
   * @abstract
   * @returns {boolean} - true if the connection is established, false otherwise.
   */
  isConnected() {
    return false;
  }

  /**
   * Disconnect from the DB.
   * @abstract
   * @returns {Promise} - Promise to be resolved when connection is disconnected, rejected if an error occurs.
   */
  disconnectDB() {
    return new Promise((resolve, reject) => {
      reject(new Error("No implementation Found!"));
    });
  }

  /**
   * Insert or update an user in the DB.
   * @abstract
   * @param {Object} user - user object containing ID and tokens and other authentication information.
   */
  upsertUser(user) {
    return new Promise((resolve, reject) => {
      reject(new Error("No implementation Found!"));
    });
  }

  /**
   * Delete an user from the DB.
   * @abstract
   * @param {string} userId - User ID equal to the google user ID.
   */
  removeUser(userId) {
    return new Promise((resolve, reject) => {
      reject(new Error("No implementation Found!"));
    });
  }

  /**
   * Get an user via user ID from the DB.
   * @abstract
   * @param {string} userId - User ID equal to the google user ID.
   */
  getUser(userId) {
    return new Promise((resolve, reject) => {
      reject(new Error("No implementation Found!"));
    });
  }

  /**
   * Insert or update the user specific settings in the DB.
   * @abstract
   * @param {Object} user - User object containing ID and tokens and other authentication information.
   * @param {Object} settings - Settings object containing the users ID and all user specific settings as fields.
   */
  upsertSettings(user, settings) {
    return new Promise((resolve, reject) => {
      reject(new Error("No implementation Found!"));
    });
  }

  /**
   * Delete an users settings from the DB.
   * @abstract
   * @param {string} userId - User ID equal to the google user ID.
   */
  removeSettings(userId) {
    return new Promise((resolve, reject) => {
      reject(new Error("No implementation Found!"));
    });
  }

  /**
   * Get an user settings via user ID from the DB.
   * @abstract
   * @param {string} userId - User ID equal to the google user ID.
   */
  getSettings(userId) {
    return new Promise((resolve, reject) => {
      reject(new Error("No implementation Found!"));
    });
  }

  /**
   * Insert or update the user specific video state information in the DB.
   * @abstract
   * @param {string} userId - User ID equal to the google user ID.
   * @param {Object} videoStates - Object containing the users ID and all user specific video states in a data field.
   */
  upsertVideoStates(userId, videoStates) {
    return new Promise((resolve, reject) => {
      reject(new Error("No implementation Found!"));
    });
  }

  /**
   * Delete an users video state information from the DB.
   * @abstract
   * @param {string} userId - User ID equal to the google user ID.
   */
  removeVideoStates(userId) {
    return new Promise((resolve, reject) => {
      reject(new Error("No implementation Found!"));
    });
  }

  /**
   * Get an user video states via user ID from the DB.
   * @abstract
   * @param {string} userId - User ID equal to the google user ID.
   */
  getVideoStates(userId) {
    return new Promise((resolve, reject) => {
      reject(new Error("No implementation Found!"));
    });
  }
}

module.exports = DBService;
