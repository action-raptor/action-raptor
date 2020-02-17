import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";

import {blockActionHandler} from "./handlers/block_action.handler";
import {slashActionHandler} from "./handlers/slash_action.handler";
import {oauthRedirectHandler} from "./handlers/auth.handler";
import {Client} from "pg";

const PORT = 5000;

const client = new Client();
client.connect();

const commandsApp: express.Application = express();
commandsApp.use(cors({origin: true}));
commandsApp.use(bodyParser.json());
commandsApp.use(bodyParser.urlencoded({extended: true}));

commandsApp.post("/action", slashActionHandler(client));
commandsApp.post("/action/block", blockActionHandler(client));
commandsApp.get("/auth/redirect", oauthRedirectHandler(client));

commandsApp.get("/", (request: express.Request, response: express.Response) => {
    response.send({hello: "world"});
});

commandsApp.listen(PORT, () => console.log(`listening on port ${PORT}`));