import {BlockAction, Context, Middleware, SlackActionMiddlewareArgs} from "@slack/bolt";
import {Block} from "@slack/types";
import {ChatPostMessageArguments} from "@slack/web-api";
import {Reader} from "fp-ts/lib/Reader";
import {AppDependencies} from "../app";
import {OpenActionItem} from "../model.action_item";
import {divider, markdownSection} from "../view";

export const postToChannelActionHandler: Reader<AppDependencies, Middleware<SlackActionMiddlewareArgs<BlockAction>>> =
    new Reader<AppDependencies, Middleware<SlackActionMiddlewareArgs<BlockAction>>>((dependencies: AppDependencies) =>
        async ({ack, body, client, respond, context}) => {
            await ack();

            const workspaceId = body.team.id;
            const channelId = body.channel?.id ?? "";
            const userId = body.user.id;

            try {
                const blocks = await getActionItemsPublic(workspaceId, channelId)(dependencies);

                await client.chat.postMessage(<ChatPostMessageArguments>{
                    username: userId,
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

const getActionItemsPublic = (workspaceId: string, channelId: string) =>
    ({pool}: AppDependencies): Promise<Block[]> => {
        const query = {
            text: "SELECT * FROM action_items WHERE workspace_id = $1 AND channel_id = $2 AND status='OPEN'",
            values: [workspaceId, channelId]
        };

        return pool.query(query)
            .then(res => {
                const actionItems: OpenActionItem[] = res.rows;

                const itemBlocks = actionItems
                    .map(actionItem =>
                        actionItem.owner
                            ? `${actionItem.description} - <@${actionItem.owner}>`
                            : `${actionItem.description}`
                    )
                    .map(text => markdownSection(text));

                return [
                    markdownSection("Here are all open action items:"),
                    divider(),
                    ...itemBlocks
                ];
            });
    };
