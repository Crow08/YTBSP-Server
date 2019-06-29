const http = require("http");
const YTBSPClient = require("./ytbspClient");
const url = require("url");
const DBService = require("./DBService");

const dbService = new DBService();
dbService.connectDB();

const scope = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/userinfo.profile"
];


const getSubscriptionWithID = (req, client, etag) => new Promise((resolve, reject) => {
  const params = new url.URL(req.url, "http://localhost:3000").searchParams;
  const apiReqParam = {
    "fields": "items(snippet(resourceId/channelId,title)),pageInfo",
    "forChannelId": params.get("forChannelId"),
    "mine": "true",
    "part": "snippet"
  };
  if (etag) {
    apiReqParam.headers = {"If-None-Match": etag};
  }
  client.youtube.subscriptions.list(apiReqParam).
    then(({data}) => resolve(data)).
    catch(reject);
});

const getSubscriptionsRecursively =
(result, youtube, maxResults, nextPageToken, etag) => new Promise((resolve, reject) => {
  const apiReqParam = {
    "fields": "items(snippet(resourceId/channelId,title)),nextPageToken,pageInfo,prevPageToken",
    maxResults,
    "mine": "true",
    "part": "snippet"
  };
  if (etag) {
    apiReqParam.headers = {"If-None-Match": etag};
  }
  if (nextPageToken) {
    apiReqParam.pageToken = nextPageToken;
  }
  youtube.subscriptions.list(apiReqParam).
    then(({data}) => {
      if (data.nextPageToken) {
        getSubscriptionsRecursively(result.concat(data.items), youtube, maxResults, data.nextPageToken, etag).
          then(resolve).
          catch(reject);
      } else {
        resolve(result);
      }
    }).
    catch(reject);
});

const getSubscriptions = (req, client, etag) => new Promise((resolve, reject) => {
  const params = new url.URL(req.url, "http://localhost:3000").searchParams;
  getSubscriptionsRecursively([], client.youtube, params.get("maxResults"), null, etag).
    then((result) => {
      console.log("finish");
      resolve(result);
    }).
    catch(reject);
});

const getPlaylistItems = (req, client, etag) => new Promise((resolve, reject) => {
  const params = new url.URL(req.url, "http://localhost:3000").searchParams;
  const apiReqParam = {
    "fields": "items(snippet(publishedAt,resourceId/videoId,thumbnails(maxres,medium),title))" +
    ",nextPageToken,pageInfo,prevPageToken",
    "maxResults": params.get("maxResults"),
    "part": "snippet",
    "playlistId": params.get("playlistId").replace(/^UC/u, "UU")
  };
  if (etag) {
    apiReqParam.headers = {"If-None-Match": etag};
  }
  client.youtube.playlistItems.list(apiReqParam).
    then(resolve).
    catch(reject);
});

const getVideoInfo = (req, client, etag) => new Promise((resolve, reject) => {
  const params = new url.URL(req.url, "http://localhost:3000").searchParams;
  const apiReqParam = {
    "fields": "items(contentDetails/duration,statistics/viewCount)",
    "id": params.get("videoId"),
    "part": "contentDetails,statistics"
  };
  if (etag) {
    apiReqParam.headers = {"If-None-Match": etag};
  }
  client.youtube.videos.list(apiReqParam).
    then(resolve).
    catch(reject);
});


const getClient = (request) => new Promise((resolve) => {
  const params = new url.URL(request.url, "http://localhost:3000").searchParams;
  const clientId = params.get("id");
  if (clientId) {
    dbService.getUser(clientId).
      then((user) => {
        console.log("fetched token for Client!");
        const client = new YTBSPClient(dbService);
        client.oAuth2Client.credentials = user;
        resolve(client);
      }).
      catch((err) => {
        console.log(err);
        console.log("cant fetch token for Client!");
        resolve(new YTBSPClient(dbService));
      });
  } else {
    console.log("new Client!");
    resolve(new YTBSPClient(dbService));
  }
});

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
const route404 = (request, response) => {
  response.writeHead(404, {"Content-Type": "text/html"});
  response.write("<div style=\"text-align: center;height: 100%;width: 100%;display: table;\">" +
    "<div style=\"display: table-cell;vertical-align: middle;\">" +
    `<h1>Error 404 : Not Found</h1>requested path: ${request.url}` +
    "</div></div>");
  response.end();
};

const routeOAuthCallback = (request, response, client) => {
  client.authenticate(request).
    then((id) => {
      if (id) {
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write(id);
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

console.log("\x1b[34m%s\x1b[0m", "--------    WebServer is starting!    --------\n");
http.createServer((request, response) => {
  getClient(request).then((client) => {
    let path = request.url;
    const paramPos = request.url.indexOf("?");
    if (paramPos > -1) {
      path = request.url.substr(0, paramPos);
    }
    switch (path) {
    case "/getAuth":
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.write(client.getAuthUrl(scope));
      response.end();
      break;
    case "/oauth2callback":
      routeOAuthCallback(request, response, client);
      break;
    case "/getsubscriptions":
      routeApiRequest(getSubscriptions, request, response, client);
      break;
    case "/getSubscriptionWithId":
      routeApiRequest(getSubscriptionWithID, request, response, client);
      break;
    case "/getPlaylistItems":
      routeApiRequest(getPlaylistItems, request, response, client);
      break;
    case "/getVideoInfo":
      routeApiRequest(getVideoInfo, request, response, client);
      break;
    default:
      route404(request, response);
      break;
    }
  });
}).listen(
  process.env.PORT || 3000,
  () => console.log("\x1b[34m%s\x1b[0m", "--------    WebServer successfully started!    --------\n")
);
