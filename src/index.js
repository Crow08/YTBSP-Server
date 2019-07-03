const http = require("http");
const fs = require("fs");
const url = require("url");
const YTBSPClient = require("./ytbspClient");
const DBService = require("./DBService");
const YouTubeApiService = require("./YouTubeApiService");
const StorageService = require("./StorageService");
let settingsPath = "./settings.json";
let settingsUrl = "";
let settings = null;
let dbService = null;
let storageService = null;

const scope = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/userinfo.profile"
];

// Parsing command line arguments.
process.argv.forEach((arg) => {
  if (arg.match(/^settings_url=.+/u)) {
    settingsUrl = arg.split("=")[1].replace("https://", "http://");
  } else if (arg.match(/^settings_path=.+/u)) {
    settingsPath = arg.split("=")[1];
  }
});

// Parsing environment variables.
if (settingsUrl === "" && typeof process.env.settings_url !== "undefined") {
  settingsUrl = process.env.settings_url.replace("https://", "http://");
}
if (settingsPath === "" && typeof process.env.settings_path !== "undefined") {
  settingsPath = process.env.settings_url;
}

// Validate content of settings file.
const validateSettings = (() => new Promise((resolve, reject) => {
  // Check for missing credentials.
  if ((typeof settings.web === "undefined" && typeof settings.installed === "undefined")) {
    reject(new Error("Your setting file is missing some necessary information!\n" +
    "Please check your settings file for missing API credentials.\n" +
    "Take a look at settings.example.json for reference."));
  }
  resolve();
}));

// Load settings.json file from disc or url.
const loadSettings = new Promise((resolve, reject) => {
  fs.access(settingsPath, fs.constants.F_OK, (existsErr) => {
    // If settings file exists:
    if (!existsErr) {
      // Read settings file.
      fs.readFile(settingsPath, (readErr, rawData) => {
        if (readErr) {
          reject(readErr);
          return;
        }
        settings = JSON.parse(rawData);
        // Check if all necessary settings are set.
        validateSettings().
          then(resolve).
          catch(reject);
      });
    // If settingsUrl is set:
    } else if (settingsUrl.length > 0) {
      // Download settings file.
      http.get(settingsUrl, (response) => {
        response.setEncoding("utf8");
        let rawData = "";
        response.on("data", (chunk) => {
          rawData += chunk;
        });
        response.on("end", () => {
          settings = JSON.parse(rawData);
          // Check if all necessary settings are set.
          validateSettings().
            then(resolve).
            catch(reject);
        });
      }).on("error", (httpErr) => {
        reject(httpErr);
      });
    } else {
      reject(new Error("Failed to load settings file!\n" +
        "Please provide a settings file at the default location (\"./settings.json\") " +
        "or set a path through the \"settings_path\" argument.\n" +
        "Alternatively you can provide \"settings_url\" as argument to refer a remote settings file."));
    }
  });
});

// Load settings from file, then initialize Mongo db connection.
loadSettings.then(() => {
  console.log("\x1b[35m%s\x1b[0m", "> Connecting to DB...\n");
  settings.db = settings.db ? settings.db : {};
  dbService = new DBService(settings.db.mongodbUrl, settings.db.mongodbUser, settings.db.mongodbPassword);
  storageService = new StorageService(dbService);
  dbService.connectDB().
    then(() => console.log("\x1b[35m%s\x1b[0m", "> DB connected!\n")).
    catch((err) => console.log(err));
});

// Get client for the script user to make GApi requests.
const getClient = (request) => new Promise((resolve) => {
  const params = new url.URL(request.url, "http://localhost:3000").searchParams;
  const clientId = params.get("id");
  if (clientId) {
    dbService.getUser(clientId).
      then((user) => {
        // Fetched token for Client.
        const client = new YTBSPClient(dbService, settings.installed || settings.web);
        client.oAuth2Client.credentials = user;
        resolve(client);
      }).
      catch((err) => {
        // Cant fetch token for Client.
        console.log(err);
        resolve(new YTBSPClient(dbService, settings.installed || settings.web));
      });
  } else {
    // New Client.
    resolve(new YTBSPClient(dbService, settings.installed || settings.web));
  }
});

// Default handling for Api Requests.
const routeApiRequest = (func, request, response, client) => {
  func(request, client).
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
};

// Handling for unknown request paths.
const route404 = (request, response) => {
  response.writeHead(404, {"Content-Type": "text/html"});
  response.write("<div style=\"text-align: center;height: 100%;width: 100%;display: table;\">" +
    "<div style=\"display: table-cell;vertical-align: middle;\">" +
    `<h1>Error 404 : Not Found</h1>requested path: ${request.url}` +
    "</div></div>");
  response.end();
};

// Handling for callback after user has authorized the server app.
const routeOAuthCallback = (request, response, client) => {
  client.authenticate(request).
    then((id) => {
      if (id) {
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(`<script>
          function receiveMessage(event){
            if (event.origin !== "http://localhost:3000") {
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
};

// Start webserver:
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
  getClient(request).then((client) => {
    let path = request.url;
    const paramPos = request.url.indexOf("?");
    if (paramPos > -1) {
      path = request.url.substr(0, paramPos);
    }
    switch (path) {
    case "/authUrl":
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.write(client.getAuthUrl(scope));
      response.end();
      break;
    case "/oauth2callback":
      routeOAuthCallback(request, response, client);
      break;
    case "/subscriptions":
      routeApiRequest(YouTubeApiService.getSubscriptions, request, response, client);
      break;
    case "/playlistItems":
      routeApiRequest(YouTubeApiService.getPlaylistItems, request, response, client);
      break;
    case "/videoInfo":
      routeApiRequest(YouTubeApiService.getVideoInfo, request, response, client);
      break;
    case "/settingsFile":
      routeApiRequest((req, cli) => storageService.settingsFile(req, cli), request, response, client);
      break;
    case "/watchInfo":
      routeApiRequest((req, cli) => storageService.watchInfo(req, cli), request, response, client);
      break;
    default:
      route404(request, response);
      break;
    }
  });
}).listen(
  process.env.PORT || 3000,
  () => console.log("\x1b[34m%s\x1b[0m", "> WebServer successfully started!\n")
);
