const https = require("https");
const fs = require("fs");

const MongoDB = require("./MongoDB");
const WebServer = require("./WebServer");

let settingsPath = "./settings.json";
let settingsUrl = "";
let settings = null;
let dbService = null;
let webserver = null;

// Parsing command line arguments.
process.argv.forEach((arg) => {
  if (arg.match(/^settings_url=.+/u)) {
    settingsUrl = arg.split("=")[1];
  } else if (arg.match(/^settings_path=.+/u)) {
    settingsPath = arg.split("=")[1];
  }
});

// Parsing environment variables.
if (settingsUrl === "" && typeof process.env.settings_url !== "undefined") {
  settingsUrl = process.env.settings_url;
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
      https.get(settingsUrl, (response) => {
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

// Load settings from file, then initialize Mongo db connection and start web server.
loadSettings.then(() => {
  console.log("\x1b[35m%s\x1b[0m", "> Connecting to DB...\n");
  settings.db = settings.db ? settings.db : {};
  dbService = new MongoDB(settings.db.mongodbUrl, settings.db.mongodbUser, settings.db.mongodbPassword);
  dbService.connectDB().
    then(() => console.log("\x1b[35m%s\x1b[0m", "> DB connected!\n")).
    catch((err) => console.log(err));
  // Start webserver:
  webserver = new WebServer(dbService, settings);
  webserver.start();
});
