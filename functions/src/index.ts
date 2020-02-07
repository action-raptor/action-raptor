import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";

import * as admin from "firebase-admin";
import {blockActionHandler} from "./handlers/block_action.handler";
import {slashActionHandler} from "./handlers/slash_action.handler";
import {oauthRedirectHandler} from "./handlers/auth.handler";

admin.initializeApp();

const firestore: admin.firestore.Firestore = admin.firestore();

const commandsApp: express.Application = express();
commandsApp.use(cors({origin: true}));

commandsApp.post("/action", slashActionHandler(firestore));
commandsApp.post("/action/block", blockActionHandler(firestore));
commandsApp.get("/auth/redirect", oauthRedirectHandler(firestore));
commandsApp.get("/", (request: express.Request, response: express.Response) => {
    response.send({hello: "world"});
});

export const commands = functions.https.onRequest(commandsApp);
