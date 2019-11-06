const http = require("http");
const url = require("url");
const YTBSPClient = require("./ytbspClient");
const YouTubeApiService = require("./YouTubeApiService");

class WebServer {

  constructor(dbService, cacheService, settings) {
    this.dbService = dbService;
    this.cacheService = cacheService;
    this.settings = settings;
  }

  static handleSettings(request, client, webServer) {
    switch (request.method) {
    case "GET":
      return webServer.getSettings(client.oAuth2Client.credentials);
    case "Patch":
    case "POST":
      return webServer.postSettings(request, client.oAuth2Client.credentials);
    case "DELETE":
      return webServer.deleteSettings(client.oAuth2Client.credentials);
    default:
      return new Promise((resolve, reject) => reject(new Error(`Invalid request method ${request.method}!`)));
    }
  }

  static handleVideoStates(request, client, webServer) {
    switch (request.method) {
    case "GET":
      return webServer.getVideoStates(client.oAuth2Client.credentials);
    case "Patch":
    case "POST":
      return webServer.postVideoStates(request, client.oAuth2Client.credentials);
    case "DELETE":
      return webServer.deleteVideoStates(client.oAuth2Client.credentials);
    default:
      return new Promise((resolve, reject) => reject(new Error(`Invalid request method ${request.method}!`)));
    }
  }

  getSettings(user) {
    return this.dbService.getSettings(user.id);
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
    return this.dbService.removeSettings(user.id);
  }

  getVideoStates(user) {
    return new Promise((resolve, reject) => {
      this.dbService.getVideoStates(user.id).
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
        this.dbService.upsertVideoStates(user.id, body).
          then(resolve).
          catch(reject);
      });
    });
  }

  deleteVideoStates(user) {
    return this.dbService.removeVideoStates(user.id);
  }

  // Get client for the script user to make GApi requests.
  getClient(request) {
    return new Promise((resolve) => {
      const params = new url.URL(request.url, "http://localhost:3000").searchParams;
      const clientId = params.get("id");
      if (clientId) {
        this.dbService.getUser(clientId).
          then((user) => {
            // Fetched token for Client.
            const client = new YTBSPClient(this.dbService, this.settings.installed || this.settings.web);
            client.oAuth2Client.credentials = user;
            resolve(client);
          }).
          catch((err) => {
            // Cant fetch token for Client.
            console.log(err);
            resolve(new YTBSPClient(this.dbService, this.settings.installed || this.settings.web));
          });
      } else {
        // New Client.
        resolve(new YTBSPClient(this.dbService, this.settings.installed || this.settings.web));
      }
    });
  }

  // Default handling for Api Requests.
  static routeApiRequest(func, request, response, client, webServer) {
    func(request, client, webServer).
      then((res) => {
        response.writeHead(200, {"Content-Type": "text/json"});
        response.write(JSON.stringify(res));
        response.end();
      }).
      catch((err) => {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err.stack);
        console.log(err.stack);
        response.end();
      });
  }

  // Handling for unknown request paths.
  static route404(request, response) {
    response.writeHead(404, {"Content-Type": "text/html"});
    response.write("<div style=\"text-align: center;height: 100%;width: 100%;display: table;\">" +
      "<div style=\"display: table-cell;vertical-align: middle;\">" +
      `<h1>Error 404 : Not Found</h1>requested path: ${request.url}` +
      "</div></div>");
    response.end();
  }

  // Handling for callback after user has authorized the server app.
  static routeOAuthCallback(request, response, client) {
    client.authenticate(request).
      then((id) => {
        if (id) {
          response.writeHead(200, {"Content-Type": "text/html"});
          response.write(`<script>
            function receiveMessage(event){
              if (event.origin === "http://www.youtube.com" || event.origin === "https://www.youtube.com") {
                event.source.postMessage("${id}", event.origin);
                console.log(event);
                window.close();
              }
            }
            window.addEventListener("message", receiveMessage, false);
          </script>`);
          response.end();
        }
      }).
      catch((err) => {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err.stack);
        console.log(err.stack);
        response.end();
      });
  }

  static routeAuthUrlRequest(request, response, client) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(client.getAuthUrl());
    response.end();
  }

  static getVideos(req, cli, webServer) {
    return new Promise((resolve, reject) => {
      webServer.cacheService.getCachedVideos(req).
        then(resolve).
        catch(() => {
          YouTubeApiService.getVideos(req, cli).
            then((data) => {
              resolve(data);
              // Cache new video:
              const videoId = new url.URL(req.url, "http://localhost:3000").searchParams.get("videoId");
              webServer.cacheService.cacheVideos(videoId, data).
                then(() => console.log(`Cached video for [${videoId}]`)).
                catch((err) => console.log(err));
            }).
            catch(reject);
        });
    });
  }

  static getPlaylistItems(req, cli, webServer) {
    return new Promise((resolve, reject) => {
      webServer.cacheService.getCachedPlaylistItems(req).
        then(resolve).
        catch(() => {
          YouTubeApiService.getPlaylistItems(req, cli).
            then((data) => {
              resolve(data);
              // Cache new playlist items:
              const playlistId = new url.URL(req.url, "http://localhost:3000").searchParams.get("playlistId");
              webServer.cacheService.cachePlaylistItems(playlistId, data).
                then(() => console.log(`Cached playlistItems for [${playlistId}]`)).
                catch((err) => console.log(err));
            }).
            catch(reject);
        });
    });
  }

  start() {
    console.log("\x1b[34m%s\x1b[0m", "> WebServer is starting...\n");
    http.createServer((request, response) => {
      // Set CORS headers
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.setHeader("Access-Control-Request-Method", "*");
      response.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
      response.setHeader("Access-Control-Allow-Headers", "*");
      if (request.method === "OPTIONS") {
        response.writeHead(200);
        response.end();
        return;
      }
      this.getClient(request).then((client) => {
        let path = request.url;
        const paramPos = request.url.indexOf("?");
        if (paramPos > -1) {
          path = request.url.substr(0, paramPos);
        }
        switch (path) {
        case "/authUrl":
          WebServer.routeAuthUrlRequest(request, response, client);
          break;
        case "/oauth2callback":
          WebServer.routeOAuthCallback(request, response, client);
          break;
        case "/subscriptions":
          WebServer.routeApiRequest(YouTubeApiService.getSubscriptions, request, response, client, this);
          break;
        case "/playlistItems":
          WebServer.routeApiRequest(WebServer.getPlaylistItems, request, response, client, this);
          break;
        case "/videos":
          WebServer.routeApiRequest(WebServer.getVideos, request, response, client, this);
          break;
        case "/settings":
          WebServer.routeApiRequest(WebServer.handleSettings, request, response, client, this);
          break;
        case "/videoStates":
          WebServer.routeApiRequest(WebServer.handleVideoStates, request, response, client, this);
          break;
        default:
          WebServer.route404(request, response);
          break;
        }
      });
    }).listen(
      process.env.PORT || 3000,
      () => console.log("\x1b[34m%s\x1b[0m", "> WebServer successfully started!\n")
    );
  }
}

module.exports = WebServer;
