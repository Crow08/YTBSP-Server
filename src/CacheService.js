const url = require("url");

class CacheService {

  constructor(dbService) {
    this.dbService = dbService;
    this.videosExpireDuration = 2592000000; // One month.
    this.lastCleanVideosJob = 0;
    this.cleanVideosJobInterval = 86400000; // One day.

    this.playlistItemsExpireDuration = 120000; // Two minutes.
    this.lastCleanPlaylistItemsJob = 0;
    this.cleanPlaylistItemsJobInterval = 60000; // One minute.
  }

  getCachedVideos(req) {
    this.cleanCachedVideos();
    return new Promise((resolve, reject) => {
      const params = new url.URL(req.url, "http://localhost:3000").searchParams;
      this.dbService.getCachedVideos(params.get("videoId")).
        then(({data}) => resolve(data)).
        catch(reject);
    });
  }

  getCachedPlaylistItems(req) {
    return new Promise((resolve, reject) => {
      this.cleanCachedPlaylistItems().
        then(() => {
          const params = new url.URL(req.url, "http://localhost:3000").searchParams;
          this.dbService.getCachedPlaylistItems(params.get("playlistId")).
            then(({data}) => resolve(data)).
            catch(reject);
        });
    });
  }

  cacheVideos(videoId, data) {
    return this.dbService.upsertCachedVideos({data, videoId});
  }

  cachePlaylistItems(playlistId, data) {
    return this.dbService.upsertCachedPlaylistItems({data, playlistId});
  }

  cleanCachedVideos() {
    const now = new Date().getTime();
    // Only start if the last clean job was longer than the interval time ago.
    if (now - this.lastCleanVideosJob > this.cleanVideosJobInterval) {
      console.log("Videos clean job started...");
      this.lastCleanVideosJob = now;
      const id = CacheService.objectIdForExpirationCheck(this.videosExpireDuration);
      this.dbService.deleteExpiredCachedVideos(id).
        then((result) => console.log(`Videos clean job complete!:
            ${JSON.stringify(result.deletedCount)} Items deleted.`)).
        catch((err) => console.log(`Videos clean job failed!:\n${err.stack}`));
    }
  }

  cleanCachedPlaylistItems() {
    return new Promise((resolve) => {
      const now = new Date().getTime();
      // Only start if the last clean job was longer than the interval time ago.
      if (now - this.lastCleanPlaylistItemsJob > this.cleanPlaylistItemsJobInterval) {
        console.log("Playlist items clean job started...");
        this.lastCleanPlaylistItemsJob = now;
        const id = CacheService.objectIdForExpirationCheck(this.playlistItemsExpireDuration);
        this.dbService.deleteExpiredCachedPlaylistItems(id).
          then((result) => console.log(`Playlist items clean job complete!:
            ${JSON.stringify(result.deletedCount)} Items deleted.`)).
          catch((err) => console.log(`"Playlist items clean job failed!:\n${err.stack}`)).
          finally(resolve);
      } else {
        resolve();
      }
    });
  }

  static objectIdForExpirationCheck(expireDuration) {
    return `${Math.floor((new Date().getTime() - expireDuration) / 1000).toString(16)}0000000000000000`;
  }
}

module.exports = CacheService;
