import {BlockAction, Context, Middleware, SlackActionMiddlewareArgs} from "@slack/bolt";
import {Block} from "@slack/types";

import {Reader} from "fp-ts/lib/Reader";

import {AppDependencies} from "../app";
import {markdownSection} from "../view";
import {ActionItem} from "../model.action_item";
import {getActionItemMenu} from "../menu";
import {fetchNotificationSettings} from "../notifications";

export const completeActionItemActionHandler: Reader<AppDependencies, Middleware<SlackActionMiddlewareArgs<BlockAction>>> =
    new Reader<AppDependencies, Middleware<SlackActionMiddlewareArgs<BlockAction>>>((dependencies: AppDependencies) =>
        async ({ack, body, respond, context, client}) => {
            await ack();

            const workspaceId = body.team.id;
            const channelId = body.channel?.id ?? "";
            const userId = body.user.id;
            const actionItemId = body.actions[0].action_id.split(":")[1];

            try {
                const actionItem = await completeActionItem(actionItemId).run(dependencies);

                const blocks = await getActionItemMenu(workspaceId, channelId, dependencies);

                await respond({
                    response_type: "ephemeral",
                    blocks: blocks,
                });

                const notificationSettings = await fetchNotificationSettings(workspaceId, channelId).run(dependencies);
                if (notificationSettings.on_action_complete) {
                    const text = actionItem.owner
                        ? `<@${body.user.id}> completed "${actionItem.description} - <@${actionItem.owner}>"`
                        : `<@${body.user.id}> completed "${actionItem.description}"`;
                    await client.chat.postMessage({
                        channel: channelId,
                        text: text,
                        blocks: [markdownSection(text)],
                    });
                }

                console.log(`completed action item. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    user_id: userId,
                    action_item_id: actionItemId,
                    notification_sent: notificationSettings.on_action_complete,
                })}`);
            } catch (err) {
                await respond({
                    response_type: "ephemeral",
                    blocks: buildErrorResponse(err, context),
                });

                console.error(`unexpected error while completing action item. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    user_id: userId,
                    action_item_id: actionItemId,
                    err: err.toString(),
                })}`);
                console.error(err);
            }
        }
    );

function completeActionItem(actionItemId: string): Reader<AppDependencies, Promise<ActionItem>> {
    return new Reader<AppDependencies, Promise<ActionItem>>(async ({pool}) => {
            const now = new Date();
            await pool.query({
                text: `UPDATE action_items SET status='COMPLETED', closed_at=$1 WHERE id=$2`,
                values: [now, actionItemId],
            });

            const result = await pool.query({
                text: `SELECT * FROM action_items WHERE id=$1`,
                values: [actionItemId],
            });
            return result.rows[0];
        }
    );
}

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
