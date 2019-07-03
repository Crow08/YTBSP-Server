class StorageService {

  constructor(dbService) {
    this.dbService = dbService;
  }

  settingsFile(request, client) {
    switch (request.method) {
    case "GET":
      return this.getSettingsFile(client.oAuth2Client.credentials);
    case "Patch":
    case "POST":
      return this.postSettingsFile(request, client.oAuth2Client.credentials);
    case "DELETE":
      return this.deleteSettingsFile(client.oAuth2Client.credentials);
    default:
      return new Promise((resolve, reject) => reject(new Error(`Invalid request method ${request.method}!`)));
    }
  }

  watchInfo(request, client) {
    switch (request.method) {
    case "GET":
      return this.getWatchInfo(client.oAuth2Client.credentials);
    case "Patch":
    case "POST":
      return this.postWatchInfo(request, client.oAuth2Client.credentials);
    case "DELETE":
      return this.deleteWatchInfo(client.oAuth2Client.credentials);
    default:
      return new Promise((resolve, reject) => reject(new Error(`Invalid request method ${request.method}!`)));
    }
  }

  getSettingsFile(user) {
    return this.dbService.getSettings(user);
  }

  postSettingsFile(req, user) {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        this.dbService.upsertSettings(user, JSON.parse(body)).
          then(resolve).
          catch(reject);
      });
    });
  }

  deleteSettingsFile(user) {
    return this.dbService.removeSettings(user);
  }

  getWatchInfo(user) {
    return new Promise((resolve, reject) => {
      this.dbService.getWatchInfo(user).
        then(({data}) => resolve(data)).
        catch(reject);
    });
  }

  postWatchInfo(req, user) {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        this.dbService.upsertWatchInfo(user, body).
          then(resolve).
          catch(reject);
      });
    });
  }

  deleteWatchInfo(user) {
    return this.dbService.removeWatchInfo(user);
  }
}

module.exports = StorageService;
