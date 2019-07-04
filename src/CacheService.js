const url = require("url");

class CacheService {

  constructor(dbService) {
    this.dbService = dbService;
    this.videoInfoExpireDuration = 2592000000; // One month.
    this.lastCleanVideoInfoJob = 0;
    this.cleanVideoInfoJobInterval = 86400000; // One day.

    this.playlistExpireDuration = 120000; // Two minutes.
    this.lastCleanPlaylistJob = 0;
    this.cleanPlaylistJobInterval = 60000; // One minute.
  }

  getCachedVideoInfo(req) {
    this.cleanCachedVideoInfo();
    return new Promise((resolve, reject) => {
      const params = new url.URL(req.url, "http://localhost:3000").searchParams;
      this.dbService.getCachedVideoInfo(params.get("videoId")).
        then(({data}) => resolve(data)).
        catch(reject);
    });
  }

  getCachedPlaylist(req) {
    return new Promise((resolve, reject) => {
      this.cleanCachedPlaylist().
        then(() => {
          const params = new url.URL(req.url, "http://localhost:3000").searchParams;
          this.dbService.getCachedPlaylist(params.get("playlistId")).
            then(({data}) => resolve(data)).
            catch(reject);
        });
    });
  }

  cacheVideoInfo(videoId, data) {
    return this.dbService.upsertCachedVideoInfo({data, videoId});
  }

  cachePlaylist(playlistId, data) {
    return this.dbService.upsertCachedPlaylist({data, playlistId});
  }

  cleanCachedVideoInfo() {
    const now = new Date().getTime();
    // Only start if the last clean job was longer than the interval time ago.
    if (now - this.lastCleanVideoInfoJob > this.cleanVideoInfoJobInterval) {
      console.log("Video info clean job started...");
      this.lastCleanVideoInfoJob = now;
      const id = CacheService.objectIdForExpirationCheck(this.videoInfoExpireDuration);
      this.dbService.deleteExpiredCachedVideoInfo(id).
        then((result) => console.log(`Video info clean job complete!:
            ${JSON.stringify(result.deletedCount)} Items deleted.`)).
        catch((err) => console.log(`Video info clean job failed!:\n${err.stack}`));
    }
  }

  cleanCachedPlaylist() {
    return new Promise((resolve) => {
      const now = new Date().getTime();
      // Only start if the last clean job was longer than the interval time ago.
      if (now - this.lastCleanPlaylistJob > this.cleanPlaylistJobInterval) {
        console.log("Playlist clean job started...");
        this.lastCleanPlaylistJob = now;
        const id = CacheService.objectIdForExpirationCheck(this.playlistExpireDuration);
        this.dbService.deleteExpiredCachedPlaylist(id).
          then((result) => console.log(`Playlist clean job complete!:
            ${JSON.stringify(result.deletedCount)} Items deleted.`)).
          catch((err) => console.log(`"Playlist clean job failed!:\n${err.stack}`)).
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
