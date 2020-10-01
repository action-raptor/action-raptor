import {Context, Middleware, SlackActionMiddlewareArgs} from "@slack/bolt";
import {Reader} from "fp-ts/lib/Reader";
import {AppDependencies} from "../app";
import {markdownSection} from "../view";
import {Block} from "@slack/types";

export const closeMenuActionHandler: Reader<AppDependencies, Middleware<SlackActionMiddlewareArgs>> =
    new Reader<AppDependencies, Middleware<SlackActionMiddlewareArgs>>((dependencies: AppDependencies) =>
        async ({ack, body, respond, context}) => {
            await ack();

            const workspaceId = body.team.id;
            const channelId = body.channel?.id ?? "";
            const userId = body.user.id;

            try {
                await respond({
                    delete_original: true,
                });

                console.log(`closed menu in channel. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    user_id: userId,
                })}`);
            } catch (err) {
                await respond({
                    response_type: "ephemeral",
                    blocks: buildErrorResponse(err, context),
                });

                console.log(`unexpected error while closing the menu. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    err: err.toString(),
                })}`);

            }
        }
    );

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