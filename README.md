### Development Environment Setup

Run local:
- install firebase-tools
- `firebase emulators:start --only firestore`
- `FIRESTORE_EMULATOR_HOST=localhost:8080 npm run serve`

Run not-local:
- download ngrok
- start ngrok

Use in workspace:
- create slack app
- add slash command
- add interactivity
- add `chat:write` scope
- install app to workspace
- auth the app
  - client id and secret
- add bot to channel