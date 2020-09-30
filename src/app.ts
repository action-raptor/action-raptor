import {App, ExpressReceiver} from "@slack/bolt";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import {RequestPromiseAPI} from "request-promise";
import {Pool} from "pg";

import {landingHandler, privacyHandler, supportHandler} from "./handlers/other.handler";

import {actionCommandHandler} from "./handlers/slash_action.handler";
import {appHomeOpenedHandler} from "./handlers/event.app_home_opened.handler";
import {blockActionHandler} from "./handlers/block_action.handler";
import {oauthRedirectHandler} from "./handlers/auth.handler";
import {setupReminders} from "./reminders";

export type AppDependencies = {
    pool: Pool
    rp: RequestPromiseAPI
};

export async function buildApp(dependencies: AppDependencies) {
    const receiver = new ExpressReceiver({signingSecret: process.env.SLACK_SIGNING_SECRET!});
    const app = new App({
        token: process.env.SLACK_TOKEN,
        receiver
    });

    receiver.router.use(cors({origin: true}));
    receiver.router.use(bodyParser.json());
    receiver.router.use(bodyParser.urlencoded({extended: true}));

    app.command("/action", actionCommandHandler.run(dependencies));
    receiver.router.post("/action/block", blockActionHandler(dependencies.pool));

    app.event<"app_home_opened">("app_home_opened", appHomeOpenedHandler.run(dependencies));

    receiver.router.get("/auth/redirect", oauthRedirectHandler(dependencies));

    receiver.router.get("/", landingHandler);
    receiver.router.get("/privacy-policy", privacyHandler);
    receiver.router.get("/support", supportHandler);

    await setupReminders(dependencies.pool);

    return app;
}
