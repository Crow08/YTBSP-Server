const url = require("url");

class CacheService {

  constructor(dbService) {
    this.dbService = dbService;
  }

  // GApi request to get video information.
  getCachedVideoInfo(req) {
    return new Promise((resolve, reject) => {
      const params = new url.URL(req.url, "http://localhost:3000").searchParams;
      this.dbService.getCachedVideoInfo(params.get("videoId")).
        then(({data}) => resolve(data)).
        catch(reject);
    });
  }

  // GApi request to get video information.
  cacheVideoInfo(videoId, data) {
    return this.dbService.upsertCachedVideoInfo({data, videoId});
  }
}

module.exports = CacheService;
