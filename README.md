# Action Raptor

Action Item Reminders! Keep yourself accountable for those pesky action items

## Development Environment Setup

#### Running locally

To get the app up and going, follow these steps:

##### Install NodeJS v10

Skip this if you already have NodeJS v10

- [install nvm](https://github.com/nvm-sh/nvm#install--update-script)
- restart your shell, or type `source ~/.zshrc` (or `source ~/.bashrc` if you use bash)
- install node v10 `nvm install 10`

##### Install Yarn

Skip this if you already have Yarn

- install yarn: `npm install -g yarn`

##### Running the app

- install dependencies `yarn install`
- create placeholder slack credentials
  - create a file called `.credentials` in the project root directory and copy/paste the contents of `.credentials-template` into it
  - we'll fill in those values later
- start a postgres db
  - the app is expecting db name "postgres", username "postgres", and port 5432
  - this comes for free if you start postgres with `brew services start postgresql`
- run migrations `yarn run migrate-local up` 
- start the server `yarn run start-local`

Check that the app is running by going to localhost:5000 in a browser. You should see that the service is "up".

#### Make cool internet tunnels

To be able to develop locally, we need to be able to provide a URL for the Slack backend to call when things happen, like "A user invoked the app with `/action`". To do this we'll use Ngrok to hit our local app from the internets.

- download ngrok: `brew cask install ngrok`
- start ngrok: `ngrok http 5000`

Take note of the URL specified next to "Forwarding". If you go to that URL, you should see the same Hello World. How neat. You should also go to the URL specified next to "Web Interface" for a cool UI that shows traffic hitting your local site. This can be really useful for inspecting payloads Slack will send. 

Another tip: this url times out after 8 hours. This can be annoying. A free ngrok account will extend this expiry (but the url will still change if you restart ngrok, unless you pay dollars). 
 
    
#### Setup the app in a Slack workspace:

You'll need a slack workspace that you have admin privileges in. Once you have that: 

- create a slack app: http://api.slack.com/
  - add it to your chosen workspace
- point the app to your local server. There are three endpoints you need to configure from the slack console: 
  - slash command URL
    - find the "Slash Commands" secion on the left nav menu
    - "Create New Command"
    - for the URL, use `<your-ngrox-url>/action`
  - interactivity URL
    - find the "Interactive Components" page (left nav)
    - click the slider switch thingy to enable "Interactivity"
    - set the Request URL to `<your-ngrox-url>/action/block`
  - oauth redirect URL
    - find the "Oauth and Permissions" page (left nav)
    - add a Redirect URL
    - set the URL to `<your-ngrox-url>/slack/oauth_redirect`
    - while you're here, scroll down a bit and make sure your app has both the `chat:write` and `commands` scopes. Add them if they're missing
- install app to workspace
  - in the "Basic Information" page (left nav), there should be a button to install/reinstall
  - note: certain changes require you to reinstall the app (maybe adding a new slash command?)
- authorize the app
  - client id and secret
- add bot to channel
  - you'll get very unhelpful silence when trying to use the bot if it's not invited to the channel

You should be good to try it out now! In a channel the bot is in, try `/action`. Hopefully, you'll see an empty list of action items. If not, you should see logs in your local server, assuming your URLs and Ngrok are set up properly. 
