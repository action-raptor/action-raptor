import {BlockAction, Context, Middleware, SlackActionMiddlewareArgs} from "@slack/bolt";
import {Block} from "@slack/types";
import {ChatPostMessageArguments} from "@slack/web-api";
import {Reader} from "fp-ts/lib/Reader";
import {AppDependencies} from "../app";
import {markdownSection} from "../view";
import {getActionItemsPublic} from "../menu";

export const postToChannelActionHandler: Reader<AppDependencies, Middleware<SlackActionMiddlewareArgs<BlockAction>>> =
    new Reader<AppDependencies, Middleware<SlackActionMiddlewareArgs<BlockAction>>>((dependencies: AppDependencies) =>
        async ({ack, body, client, respond, context}) => {
            await ack();

            const workspaceId = body.team.id;
            const channelId = body.channel?.id ?? "";
            const userId = body.user.id;

            try {
                const blocks = await getActionItemsPublic(workspaceId, channelId, dependencies);

                await client.chat.postMessage(<ChatPostMessageArguments>{
                    channel: channelId,
                    blocks: blocks,
                });
                await respond({
                    delete_original: true,
                });

                console.log(`posted action items to channel. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    user_id: userId,
                })}`);
            } catch (err) {
                await respond({
                    response_type: "ephemeral",
                    blocks: buildErrorResponse(err, context),
                });

                console.error(`unexpected error while posting action items to channel. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    user_id: userId,
                    err: err.toString(),
                })}`);
                console.error(err);
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
