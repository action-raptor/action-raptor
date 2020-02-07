## Development Environment Setup

##### Running locally

This app is a backend built with Firebase. Though our endpoints are Functions-as-a-service and not an actual web server, we can use a set of Firebase emulators to run locally.

To get the app up and going, follow these steps:

- install firebase-tools cli: `npm install -g firebase-tools`
- run `firebase emulators:start --only firestore`
- in a different console, run `FIRESTORE_EMULATOR_HOST=localhost:8080 npm run serve`

You should see output similar to `functions[commands]: http function initialized (http://localhost:5000/action-raptor-prod/us-central1/commands)`. 
Check that the app is working by going to that url in a browser. You should see some version of Hello World.

##### Make cool internet tunnels

To be able to develop locally, we need to be able to provide a URL for the Slack backend to call when things happen, like "A user invoked the app with `/action`". To do this we'll use Ngrok to hit our local app from the internet.

- download ngrok: `brew install cask ngrok`
- start ngrok: `ngrok https 5000`

Take note of the URL specified next to "Forwarding". If you go to that URL + `action-raptor-prod/us-central1/commands`, you should see the same Hello World. How neat. You should also go to the URL specified next to "Web Interface" for a cool UI that shows traffic hitting your local site. This can be really useful for inspecting payloads Slack will send.  
 
    
##### Setup the app in a Slack workspace:

- create slack app
- add slash command
- add interactivity
- add `chat:write` scope
- install app to workspace
- auth the app
  - client id and secret
- add bot to channel
