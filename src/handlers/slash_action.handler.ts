import {Context, Middleware, SlackCommandMiddlewareArgs} from "@slack/bolt";
import {Block} from "@slack/types";

import {Reader} from "fp-ts/lib/Reader";

import {markdownSection} from "../view";
import {getActionItemMenu} from "../menu";
import {AppDependencies} from "../app";

export const actionCommandHandler: Reader<AppDependencies, Middleware<SlackCommandMiddlewareArgs>> =
    new Reader<AppDependencies, Middleware<SlackCommandMiddlewareArgs>>((dependencies: AppDependencies) =>
        async ({command, ack, context, respond}) => {
            await ack();

            const workspaceId = command.team_id;
            const channelId = command.channel_id;
            const userId = command.user_id;

            try {
                const blocks = await getActionItemMenu(workspaceId, channelId, dependencies);

                await respond({
                    response_type: "ephemeral",
                    blocks: blocks,
                });

                console.log(`opened menu. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    user_id: userId,
                })}`);
            } catch (err) {
                await respond({
                    response_type: "ephemeral",
                    blocks: buildErrorResponse(err, context),
                });

                console.error(`unexpected error while opening menu. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    user_id: userId,
                    err: err
                })}`);
                console.error(err);
            }
        });

function buildErrorResponse(err: any, context: Context): Block[] {
    if (err.data?.error === "not_in_channel") {
        return [
            markdownSection(`please add <@${context.botUserId}> to the channel`),
        ];
    }
    if (err.data?.error === "channel_not_found") {
        return [
            markdownSection(`<@${context.botUserId}> cannot post in private channels`),
        ];
    }
    return [
        markdownSection(`something went wrong. please try again`),
    ];
}
