# YTBSP-Server
[![version](https://img.shields.io/github/package-json/v/Crow08/ytbsp-server.svg)](/package.json)
[![dependencies](https://david-dm.org/Crow08/ytbsp-server.svg)](/package.json)
[![Known Vulnerabilities](https://snyk.io/test/github/Crow08/YTBSP-Server/badge.svg)](https://snyk.io/test/github/Crow08/YTBSP-Server)
[![license](https://img.shields.io/github/license/Crow08/ytbsp-server.svg)](/LICENSE.md)

Caching server for YouTube API requests made for usage with the [YTBSP-userscript](https://github.com/Crow08/YTBSP-Server).

## REST-API ###
- "/authUrl":  
`Get` Google authentication url for googles OAuth2 authentication process.
- "/oauth2callback":  
`Get` callback for authentication with google redirected by Google API.
- "/subscriptions":  
`Get` subscription resources that match the API request criteria.  
https://developers.google.com/youtube/v3/docs/subscriptions/list
- "/playlistItems":  
`Get` a __cached__ collection of playlist items that match the API request parameters.  
https://developers.google.com/youtube/v3/docs/playlistItems/list
- "/videos":  
`Get` a __cached__ list of videos that match the API request parameters.  
https://developers.google.com/youtube/v3/docs/videos/list
- "/settings":  
`Get` or `Post` user settings as json (stored in MongoDB).
- "/videoStates":  
`Get` or `Post` user video information as json (stored in MongoDB).

## Installation: ##
- Install node (with NPM >= 10) 
- Install mongoDB on the host computer or set up a remote mongoDB
- Run `npm install` in the project directory.
- configure your settings:
  - Copy the `settings.example.json` and rename it to `settings.json`
  - Open `settings.json` and replace the dummy values with your actual credentials.  
  For `"web"` use the credentials downloaded (see API client section).  
  Leave `"db"` empty if using mongoDB on localhost else fill the three fields.
  - If you want to locate the `settings.json` not in the project root directory you can change the path using the `"settings_path"` environment variable or the `"settings_path=..."` command line argument.
  - The settings file can also be fetched using the `"settings_url"` environment variable or the `"settings_url=..."` command line argument.
- Run `npm run start` in the project directory.
- Enjoy your server!

### API client ### 
This server depends on a Google API project and the Youtube v3 API.
To start a project and enable the API please read the reference:  
https://developers.google.com/youtube/v3/getting-started

After your project is set up you can download the credentials JSON file from:  
https://console.cloud.google.com/apis/credentials
![credentials](https://user-images.githubusercontent.com/21142074/61789938-3b5d6200-ae16-11e9-80a5-2f23beb3db81.png)

### Hosting ###
Works great with [heroku](https://heroku.com) (free*).  
The settings and credentials can be set via heroku environment variables.  
We recommend to host the DB on an external server like [MongoDB Cloud](https://cloud.mongodb.com) (free*).  
\* Services have free and paid plans.
