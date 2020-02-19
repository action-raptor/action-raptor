## Development Environment Setup

##### Running locally

To get the app up and going, follow these steps:

- install yarn `npm install -g yarn`
- run `yarn run start-local`

 Check that the app is working by going to localhost:5000 in a browser. You should see that the service is "up".

##### Make cool internet tunnels

To be able to develop locally, we need to be able to provide a URL for the Slack backend to call when things happen, like "A user invoked the app with `/action`". To do this we'll use Ngrok to hit our local app from the internet.

- download ngrok: `brew cask install ngrok`
- start ngrok: `ngrok https 5000`

Take note of the URL specified next to "Forwarding". If you go to that URL + `action-raptor-prod/us-central1/commands`, you should see the same Hello World. How neat. You should also go to the URL specified next to "Web Interface" for a cool UI that shows traffic hitting your local site. This can be really useful for inspecting payloads Slack will send.  
 
    
##### Setup the app in a Slack workspace:



- create a slack app
  - 
- add slash command
- add interactivity
- add `chat:write` scope
- install app to workspace
- auth the app
  - client id and secret
- add bot to channel
