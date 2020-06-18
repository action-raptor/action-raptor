import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";

import {blockActionHandler} from "./handlers/block_action.handler";
import {slashActionHandler} from "./handlers/slash_action.handler";
import {oauthRedirectHandler} from "./handlers/auth.handler";
import {Client} from "pg";
import {dbOptions} from "./config";
import {Agent} from "https";
import * as rp from "request-promise";
import {eventHandler} from "./handlers/event.handler";

import {setupReminders} from "./reminders";

const PORT = process.env.PORT || 5000;

const agent = new Agent({keepAlive: true});
const rpApi = rp.defaults({agent});

const client = new Client(dbOptions);
client.connect();

const commandsApp: express.Application = express();
commandsApp.use(cors({origin: true}));
commandsApp.use(bodyParser.json());
commandsApp.use(bodyParser.urlencoded({extended: true}));

commandsApp.post("/action", slashActionHandler(client));
commandsApp.post("/action/block", blockActionHandler(client));
commandsApp.get("/auth/redirect", oauthRedirectHandler({client, rpApi}));
commandsApp.post("/event", eventHandler(client));

commandsApp.get("/", (request: express.Request, response: express.Response) => {
    response.send({status: "up"});
});

commandsApp.listen(PORT, () => console.log(`listening on port ${PORT}`));

setupReminders(client);