import {App, BlockAction, ExpressReceiver, ViewSubmitAction} from "@slack/bolt";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import {RequestPromiseAPI} from "request-promise";
import {Pool} from "pg";

import {landingHandler, privacyHandler, supportHandler} from "./handlers/other.handler";

import {actionCommandHandler} from "./handlers/slash_action.handler";
import {appHomeOpenedHandler} from "./handlers/event.app_home_opened.handler";
import {oauthRedirectHandler} from "./handlers/auth.handler";
import {setupReminders} from "./reminders";
import {addActionItemActionHandler} from "./handlers/action.add_action_item.handler";
import {postToChannelActionHandler} from "./handlers/action.post_to_channel.handler";
import {closeMenuActionHandler} from "./handlers/action.close_menu.handler";
import {completeActionItemActionHandler} from "./handlers/action.complete_action_item.handler";
import {arMenuActions} from "./model.menu_actions";
import {openActionItemModalActionHandler} from "./handlers/action.open_action_item_modal.handler";

export type AppDependencies = {
    pool: Pool
    rp: RequestPromiseAPI
};

export async function buildApp(dependencies: AppDependencies) {
    const receiver = new ExpressReceiver({signingSecret: process.env.SLACK_SIGNING_SECRET!});
    const app = new App({
        token: process.env.SLACK_TOKEN,
        receiver,
    });

    receiver.router.use(cors({origin: true}));
    receiver.router.use(bodyParser.json());
    receiver.router.use(bodyParser.urlencoded({extended: true}));

    app.command("/action", actionCommandHandler.run(dependencies));

    app.action<BlockAction>({action_id: arMenuActions.openActionItemModal}, openActionItemModalActionHandler.run(dependencies));
    app.action<BlockAction>({action_id: arMenuActions.postToChannel}, postToChannelActionHandler.run(dependencies));
    app.action<BlockAction>({action_id: arMenuActions.closeMenu}, closeMenuActionHandler.run(dependencies));
    app.action<BlockAction>({action_id: new RegExp(`^${arMenuActions.completeActionItem}`)}, completeActionItemActionHandler.run(dependencies));

    app.view<ViewSubmitAction>(
        {type: "view_submission", callback_id: arMenuActions.addActionItem},
        addActionItemActionHandler.run(dependencies)
    );

    app.event<"app_home_opened">("app_home_opened", appHomeOpenedHandler.run(dependencies));

    receiver.router.get("/auth/redirect", oauthRedirectHandler(dependencies));

    receiver.router.get("/", landingHandler);
    receiver.router.get("/privacy-policy", privacyHandler);
    receiver.router.get("/support", supportHandler);

    await setupReminders({
        ...dependencies,
        client: app.client,
    });

    return app;
}
