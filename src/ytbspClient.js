const {google} = require("googleapis");
const url = require("url");

class YTBSPClient {
  constructor(dbService, keys) {
    this.dbService = dbService;
    // Validate the redirectUri.  This is a frequent cause of confusion.
    if (!keys.redirect_uris || keys.redirect_uris.length === 0) {
      throw new Error(`The provided settings.json does not define a valid
      redirect URI. There must be at least one redirect URI defined. Please edit
      your settings.json, and add a 'redirect_uris' section.`);
    }

    this.scope = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.profile"
    ];

    const redirectUri = keys.redirect_uris.find((uri) => uri.includes("/oauth2callback"));

    // Create an oAuth client to authorize the API call
    this.oAuth2Client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      redirectUri
    );

    // Initialize the Youtube API library
    this.youtube = google.youtube({
      "auth": this.oAuth2Client,
      "version": "v3"
    });

    this.drive = google.drive({
      "auth": this.oAuth2Client,
      "version": "v3"
    });

    // "tokens" update event: Update token in DB.
    this.oAuth2Client.on("tokens", (tokens) => {
      if (tokens) {
        this.oAuth2Client.getTokenInfo(tokens.access_token).
          then((info) => {
            console.log(info.sub);
            tokens.id = info.sub;
            // Save new token with userId to DB.
            dbService.upsertUser(tokens).catch((err) => {
              console.log(err);
            });
          }).
          catch((err) => {
            console.log(err);
          });
      }
    });
  }

  getAuthUrl() {
    return this.oAuth2Client.generateAuthUrl({
      "access_type": "offline",
      "scope": this.scopes.join(" ")
    });
  }

  authenticate(req) {
    return new Promise((resolve, reject) => {
      // Grab the url that will be used for authorization
      const params = new url.URL(req.url, "http://localhost:3000").searchParams;
      this.oAuth2Client.getToken(params.get("code")).
        then(({tokens}) => {
          this.oAuth2Client.credentials = tokens;
          this.oAuth2Client.getTokenInfo(tokens.access_token).
            then((info) => {
              resolve(info.sub);
            }).
            catch(reject);
        }).
        catch(reject);
    });
  }
}

module.exports = YTBSPClient;
