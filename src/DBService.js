const {MongoClient} = require("mongodb");

class DBService {

  /**
   * Constructor.
   * @param {string} mongoUrl - Optional string representing the external mongodb url.
   * @param {string} username - Optional string representing the external mongodb username.
   * @param {string} password - Optional string representing the external mongodb password.
   */
  constructor(mongoUrl, username, password) {
    this.url = mongoUrl ? `mongodb+srv://${username}:${password}@${mongoUrl}` : "mongodb://localhost:27017";
    this.dbName = "ytbsp-server";
    this.client = null;
    this.db = null;
  }

  /**
   * Connection to MongoDB.
   * If a connection is already established disconnect first.
   */
  connectDB() {
    // If client connection doesn't exists.
    if (this.client === null) {
      return new Promise((resolve, reject) => {
        MongoClient.connect(this.url, {"useNewUrlParser": true}).
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
   * Check if connection to mongoDB is established.
   */
  isConnected() {
    return this.client !== null && this.client.isConnected();
  }

  /**
   * Disconnect from MongoDB.
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

  upsertUser(user) {
    return new Promise((resolve, reject) => {
      this.db.collection("users").
        replaceOne({"id": user.id}, user, {"upsert": true}).
        then(resolve).
        catch(reject);
    });
  }

  removeUser(user) {
    return new Promise((resolve, reject) => {
      this.db.collection("users").
        deleteOne({"id": user.id}).
        then(resolve).
        catch(reject);
    });
  }

  getUser(id) {
    return new Promise((resolve, reject) => {
      this.db.collection("users").
        findOne({id}).
        then(resolve).
        catch(reject);
    });
  }

  getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.collection("users").
        find({}).
        toArray().
        then(resolve).
        catch(reject);
    });
  }

  upsertSettings(user, settings) {
    return new Promise((resolve, reject) => {
      this.db.collection("settings").
        replaceOne({"id": user.id}, {...settings, "id": user.id}, {"upsert": true}).
        then(resolve).
        catch(reject);
    });
  }

  removeSettings(user) {
    return new Promise((resolve, reject) => {
      this.db.collection("settings").
        deleteOne({"id": user.id}).
        then(resolve).
        catch(reject);
    });
  }

  getSettings(user) {
    return new Promise((resolve, reject) => {
      this.db.collection("settings").
        findOne({"id": user.id}).
        then(resolve).
        catch(reject);
    });
  }

  upsertWatchInfo(user, watchInfo) {
    return new Promise((resolve, reject) => {
      this.db.collection("watchInfo").
        replaceOne({"id": user.id}, {...watchInfo, "id": user.id}, {"upsert": true}).
        then(resolve).
        catch(reject);
    });
  }

  removeWatchInfo(user) {
    return new Promise((resolve, reject) => {
      this.db.collection("watchInfo").
        deleteOne({"id": user.id}).
        then(resolve).
        catch(reject);
    });
  }

  getWatchInfo(user) {
    return new Promise((resolve, reject) => {
      this.db.collection("watchInfo").
        findOne({"id": user.id}).
        then(resolve).
        catch(reject);
    });
  }
}

module.exports = DBService;
