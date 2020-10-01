import {BlockAction, Middleware, SlackActionMiddlewareArgs} from "@slack/bolt";
import {View} from "@slack/types";
import {Reader} from "fp-ts/lib/Reader";
import {AppDependencies} from "../app";

export const addActionItemActionHandler: Reader<AppDependencies, Middleware<SlackActionMiddlewareArgs<BlockAction>>> =
    new Reader<AppDependencies, Middleware<SlackActionMiddlewareArgs<BlockAction>>>((dependencies: AppDependencies) =>
        async ({ack, body, client}) => {
            await ack();

            const workspaceId = body.team.id;
            const channelId = body.channel?.id ?? "";
            const userId = body.user.id;

            try {
                const viewOpenResult = await client.views.open({
                    trigger_id: body.trigger_id,
                    view: addItemModal(""),
                });

                console.log(`opened modal view. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    user_id: userId,
                    result: viewOpenResult,
                })}`);
            } catch (err) {
                console.log(`unexpected error while opening modal view. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    user_id: userId,
                    err: err
                })}`);
            }
        }
    );

export const addItemModal = (metadata: string): View => {
    return {
        type: "modal",
        title: {
            type: "plain_text",
            text: "New Action Item",
            emoji: true
        },
        submit: {
            type: "plain_text",
            text: "Add",
            emoji: true
        },
        close: {
            type: "plain_text",
            text: "Cancel",
            emoji: true
        },
        blocks: [
            {
                type: "input",
                block_id: "item_description",
                element: {
                    type: "plain_text_input",
                    action_id: "title",
                    placeholder: {
                        type: "plain_text",
                        text: "What needs done?"
                    }
                },
                label: {
                    type: "plain_text",
                    text: "Description"
                }
            },
            {
                type: "input",
                block_id: "owner_select",
                label: {
                    type: "plain_text",
                    text: "Action Item Owner"
                },
                element: {
                    action_id: "selected_item_owner",
                    type: "users_select",
                    placeholder: {
                        type: "plain_text",
                        text: "Select an item"
                    }
                }
            }
        ],
        private_metadata: metadata
    }
};
