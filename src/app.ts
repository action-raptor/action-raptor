import {App, BlockAction, ExpressReceiver, ViewSubmitAction} from "@slack/bolt";
import {Installation, InstallationQuery} from "@slack/oauth";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import {RequestPromiseAPI} from "request-promise";
import {Pool} from "pg";

import {landingHandler, privacyHandler, supportHandler} from "./handlers/other.handler";

import {actionCommandHandler} from "./handlers/slash_action.handler";
import {appHomeOpenedHandler} from "./handlers/event.app_home_opened.handler";
import {setupReminders} from "./reminders";
import {addActionItemActionHandler} from "./handlers/action.add_action_item.handler";
import {postToChannelActionHandler} from "./handlers/action.post_to_channel.handler";
import {closeMenuActionHandler} from "./handlers/action.close_menu.handler";
import {completeActionItemActionHandler} from "./handlers/action.complete_action_item.handler";
import {arMenuActions} from "./model.menu_actions";
import {openActionItemModalActionHandler} from "./handlers/action.open_action_item_modal.handler";
import {clientId, clientSecret, signingSecret} from "./config";
import {arSlackTokens} from "./slack_bot_tokens";

export type AppDependencies = {
    pool: Pool
    rp: RequestPromiseAPI
};

export async function buildApp(dependencies: AppDependencies) {
    const receiver = new ExpressReceiver({
        signingSecret: signingSecret,
        clientId: clientId,
        clientSecret: clientSecret,
        stateSecret: "action-raptor-state-secret",
        scopes: ["channels:read", "chat:write", "commands", "team:read", "users:read", "users:read.email", "users:write",],
        installationStore: {
            storeInstallation: async (installation: Installation): Promise<void> => {
                arSlackTokens.workspace(installation.team.id).bot
                    .save(installation.bot?.id!, installation.bot?.userId!, installation.bot?.token!)
                    .run(dependencies)
            },
            fetchInstallation: async (query: InstallationQuery): Promise<Installation> =>
                arSlackTokens.workspace(query.teamId).bot
                    .get
                    .run(dependencies)
                    .then(token => (<Installation>{
                        bot: {
                            id: token.bot_id,
                            userId: token.bot_user_id,
                            token: token.value
                        }
                    })),
        },
    });
    const app = new App({
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

    receiver.router.get("/", landingHandler);
    receiver.router.get("/privacy-policy", privacyHandler);
    receiver.router.get("/support", supportHandler);

    await setupReminders({
        ...dependencies,
        client: app.client,
    });

    return app;
}
