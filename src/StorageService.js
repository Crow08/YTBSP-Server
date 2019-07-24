class StorageService {

  constructor(dbService) {
    this.dbService = dbService;
  }

  settings(request, client) {
    switch (request.method) {
    case "GET":
      return this.getSettings(client.oAuth2Client.credentials);
    case "Patch":
    case "POST":
      return this.postSettings(request, client.oAuth2Client.credentials);
    case "DELETE":
      return this.deleteSettings(client.oAuth2Client.credentials);
    default:
      return new Promise((resolve, reject) => reject(new Error(`Invalid request method ${request.method}!`)));
    }
  }

  videoStates(request, client) {
    switch (request.method) {
    case "GET":
      return this.getVideoStates(client.oAuth2Client.credentials);
    case "Patch":
    case "POST":
      return this.postVideoStates(request, client.oAuth2Client.credentials);
    case "DELETE":
      return this.deleteVideoStates(client.oAuth2Client.credentials);
    default:
      return new Promise((resolve, reject) => reject(new Error(`Invalid request method ${request.method}!`)));
    }
  }

  getSettings(user) {
    return this.dbService.getSettings(user);
  }

  postSettings(req, user) {
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

  deleteSettings(user) {
    return this.dbService.removeSettings(user);
  }

  getVideoStates(user) {
    return new Promise((resolve, reject) => {
      this.dbService.getVideoStates(user).
        then((result) => {
          if (result && result.data) {
            resolve(result.data);
          } else {
            resolve("[]");
          }
        }).
        catch(reject);
    });
  }

  postVideoStates(req, user) {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        this.dbService.upsertVideoStates(user, body).
          then(resolve).
          catch(reject);
      });
    });
  }

  deleteVideoStates(user) {
    return this.dbService.removeVideoStates(user);
  }
}

module.exports = StorageService;
