const url = require("url");

class GDriveApiService {

  static settingsFile(request, client, etag) {
    switch (request.method) {
    case "GET":
      return GDriveApiService.getSettingsFile(request, client, etag);
    case "POST":
      return GDriveApiService.postSettingsFile(request, client, etag);
    case "DELETE":
      return GDriveApiService.deleteSettingsFile(request, client, etag);
    case "Patch":
      return GDriveApiService.patchSettingsFile(request, client, etag);
    default:
      return new Promise((resolve, reject) => reject(new Error(`Invalid request method ${request.method}!`)));
    }
  }

  static settingsFileContent(request, client, etag) {
    switch (request.method) {
    case "GET":
      return GDriveApiService.getSettingsFileContent(request, client, etag);
    case "Patch":
      return GDriveApiService.patchSettingsFileContent(request, client, etag);
    default:
      return new Promise((resolve, reject) => reject(new Error(`Invalid request method ${request.method}!`)));
    }
  }

  // GApi request for the settings file.
  static getSettingsFile(req, client, etag) {
    return new Promise((resolve, reject) => {
      const apiReqParam = {
        "fields": "files(appProperties,id,name)",
        "q": "name = 'YTBSP.json'",
        "spaces": "appDataFolder"
      };
      if (etag) {
        apiReqParam.headers = {"If-None-Match": etag};
      }
      client.drive.files.list(apiReqParam).
        then(({data}) => resolve(data)).
        catch(reject);
    });
  }

  // GApi request to create a new settings file.
  static postSettingsFile(req, client, etag) {
    return new Promise((resolve, reject) => {
      const params = new url.URL(req.url, "http://localhost:3000").searchParams;
      const apiReqParam = {
        "fields": "appProperties,id,name",
        "requestBody": {
          "appProperties": params.get("appProperties"),
          "name": "YTBSP.json",
          "parents": ["appDataFolder"]
        }
      };
      if (etag) {
        apiReqParam.headers = {"If-None-Match": etag};
      }
      client.drive.files.create(apiReqParam).
        then(({data}) => {
          resolve(data);
        }).
        catch(reject);
    });
  }

  // GApi request to update the settings file.
  static patchSettingsFile(req, client, etag) {
    return new Promise((resolve, reject) => {
      const params = new url.URL(req.url, "http://localhost:3000").searchParams;
      const apiReqParam = {
        "fileId": params.get("fileId"),
        "requestBody": {
          "appProperties": params.get("appProperties")
        }
      };
      if (etag) {
        apiReqParam.headers = {"If-None-Match": etag};
      }
      client.drive.files.create(apiReqParam).
        then(({data}) => {
          resolve(data);
        }).
        catch(reject);
    });
  }

  // GApi request to delete settings file.
  static deleteSettingsFile(req, client, etag) {
    return new Promise((resolve, reject) => {
      const params = new url.URL(req.url, "http://localhost:3000").searchParams;
      const apiReqParam = {
        "fileId": params.get("fileId")
      };
      if (etag) {
        apiReqParam.headers = {"If-None-Match": etag};
      }
      client.drive.files.delete(apiReqParam).
        then(resolve).
        catch(reject);
    });
  }

  // GApi request to get video information.
  static getSettingsFileContent(req, client, etag) {
    return new Promise((resolve, reject) => {
      const params = new url.URL(req.url, "http://localhost:3000").searchParams;
      const apiReqParam = {
        "alt": "media",
        "fileId": params.get("fileId")
      };
      if (etag) {
        apiReqParam.headers = {"If-None-Match": etag};
      }
      client.drive.files.get(apiReqParam).
        then(({data}) => resolve(data)).
        catch(reject);
    });
  }

  // GApi request save video information.
  static patchSettingsFileContent(req, client, etag) {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        console.log(body);
        const params = new url.URL(req.url, "http://localhost:3000").searchParams;
        const apiReqParam = {
          "fileId": params.get("fileId"),
          "media": {
            body,
            "mimeType": "text/plain"
          }
        };
        if (etag) {
          apiReqParam.headers = {"If-None-Match": etag};
        }
        client.drive.files.update(apiReqParam).
          then(({data}) => resolve(data)).
          catch(reject);
      });
    });
  }
}

module.exports = GDriveApiService;
