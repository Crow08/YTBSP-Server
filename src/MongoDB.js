const {MongoClient} = require("mongodb");

const DBService = require("./DBService.js");

/**
 * DB Service Class for MongoDB.
 * @extends DBService
 * @Category Service
 */
class MongoDB extends DBService {

  /**
   * Constructor.
   * @param {string} mongoUrl - Optional string representing the external mongodb url.
   * @param {string} username - Optional string representing the external mongodb username.
   * @param {string} password - Optional string representing the external mongodb password.
   */
  constructor(mongoUrl, username, password) {
    super();
    this.url = mongoUrl ? `mongodb+srv://${username}:${password}@${mongoUrl}` : "mongodb://localhost:27017";
    this.dbName = "ytbsp-server";
    this.client = null;
    this.db = null;
  }

  /**
   * @override
   */
  connectDB() {
    // If client connection doesn't exists.
    if (this.client === null) {
      return new Promise((resolve, reject) => {
        MongoClient.connect(this.url, {"useNewUrlParser": true, "useUnifiedTopology": true}).
          then((client) => {
            this.client = client;
            this.db = this.client.db(this.dbName);
            resolve();
          }).
          catch(reject);
      });
    }
    // If client connection exists.
    // Disconnect first before opening a new connection.
    return new Promise((resolve, reject) => {
      this.disconnectDB().
        catch((err) => {
          console.log(err);
          this.client = null;
          this.db = null;
        }).
        finally(() => {
          this.connectDB().
            then(resolve).
            catch(reject);
        });
    });
  }

  /**
   * @override
   */
  isConnected() {
    return this.client !== null && this.client.isConnected();
  }

  /**
   * @override
   */
  disconnectDB() {
    return new Promise((resolve, reject) => {
      this.client.close().
        then(() => {
          this.client = null;
          this.db = null;
          resolve();
        }).
        catch(reject);
    });
  }

  /**
   * @override
   */
  upsertUser(user) {
    return new Promise((resolve, reject) => {
      this.db.collection("users").
        replaceOne({"id": user.id}, user, {"upsert": true}).
        then(resolve).
        catch(reject);
    });
  }

  /**
   * @override
   */
  removeUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.collection("users").
        deleteOne({"id": userId}).
        then(resolve).
        catch(reject);
    });
  }

  /**
   * @override
   */
  getUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.collection("users").
        findOne({"id": userId}).
        then(resolve).
        catch(reject);
    });
  }

  /**
   * @override
   */
  upsertSettings(user, settings) {
    return new Promise((resolve, reject) => {
      this.db.collection("settings").
        replaceOne({"id": user.id}, {...settings, "id": user.id}, {"upsert": true}).
        then(resolve).
        catch(reject);
    });
  }

  /**
   * @override
   */
  removeSettings(userId) {
    return new Promise((resolve, reject) => {
      this.db.collection("settings").
        deleteOne({"id": userId}).
        then(resolve).
        catch(reject);
    });
  }

  /**
   * @override
   */
  getSettings(userId) {
    return new Promise((resolve, reject) => {
      this.db.collection("settings").
        findOne({"id": userId}).
        then(resolve).
        catch(reject);
    });
  }

  /**
   * @override
   */
  upsertVideoStates(userId, videoStates) {
    return new Promise((resolve, reject) => {
      this.db.collection("videoStates").
        replaceOne({"id": userId}, {"data": videoStates, "id": userId}, {"upsert": true}).
        then(resolve).
        catch(reject);
    });
  }

  /**
   * @override
   */
  removeVideoStates(userId) {
    return new Promise((resolve, reject) => {
      this.db.collection("videoStates").
        deleteOne({"id": userId}).
        then(resolve).
        catch(reject);
    });
  }

  /**
   * @override
   */
  getVideoStates(userId) {
    return new Promise((resolve, reject) => {
      this.db.collection("videoStates").
        findOne({"id": userId}).
        then(resolve).
        catch(reject);
    });
  }
}

module.exports = MongoDB;
