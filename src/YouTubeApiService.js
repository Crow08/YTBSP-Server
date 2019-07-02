const url = require("url");

class YouTubeApiService {

  // GApi request to get subscriptions page for the client.
  static getSubscriptions(req, client, etag) {
    return new Promise((resolve, reject) => {
      const params = new url.URL(req.url, "http://localhost:3000").searchParams;
      const apiReqParam = {
        "fields": "items(snippet(resourceId/channelId,title)),nextPageToken,pageInfo,prevPageToken",
        "mine": "true",
        "part": "snippet"
      };
      if (etag) {
        apiReqParam.headers = {"If-None-Match": etag};
      }
      if (params.get("maxResults")) {
        apiReqParam.maxResults = params.get("maxResults");
      }
      if (params.get("nextPageToken")) {
        apiReqParam.pageToken = params.get("nextPageToken");
      }
      if (params.get("forChannelId")) {
        apiReqParam.forChannelId = params.get("forChannelId");
      }
      client.youtube.subscriptions.list(apiReqParam).
        then(({data}) => {
          resolve(data);
        }).
        catch(reject);
    });
  }

  // GApi request to get playlist item information.
  static getPlaylistItems(req, client, etag) {
    return new Promise((resolve, reject) => {
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
  }

  // GApi request to get video information.
  static getVideoInfo(req, client, etag) {
    return new Promise((resolve, reject) => {
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
  }
}

module.exports = YouTubeApiService;
