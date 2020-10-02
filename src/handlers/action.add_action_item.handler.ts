import {Middleware, SlackViewMiddlewareArgs, ViewSubmitAction} from "@slack/bolt";
import {Block} from "@slack/types";
import {Reader} from "fp-ts/lib/Reader";
import {AppDependencies} from "../app";
import {getActionItemMenu} from "../menu";
import {markdownSection} from "../view";

export const addActionItemActionHandler: Reader<AppDependencies, Middleware<SlackViewMiddlewareArgs<ViewSubmitAction>>> =
    new Reader<AppDependencies, Middleware<SlackViewMiddlewareArgs<ViewSubmitAction>>>((dependencies: AppDependencies) =>
        async ({ack, body, client}) => {
            await ack();

            const metadata = JSON.parse(body.view.private_metadata ?? "{}");

            const workspaceId = body.team.id;
            const channelId = metadata.channel_id;
            const userId = body.user.id;

            const description = body.view.state.values.item_description?.title?.value?.toString();
            const ownerId = body.view.state.values.owner_select?.selected_item_owner?.selected_user?.toString();

            const responseUrl = metadata.response_url;

            try {
                await saveNewActionItem(description, workspaceId, channelId, ownerId)(dependencies);

                const blocks: Block[] = await getActionItemMenu(workspaceId, channelId, dependencies.pool)
                    .catch((err: any) => {
                        console.error(`error fetching items: ${err}`);

                        return [
                            markdownSection(`something went wrong. please try again`),
                        ];
                    });

                await updateMenu(responseUrl, blocks);

                console.log(`added action item. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    user_id: userId,
                    action_item: {
                        description: description,
                        owner_id: ownerId,
                    },
                })}`);
            } catch (err) {
                console.log(`unexpected error while adding action item. ${JSON.stringify({
                    workspace_id: workspaceId,
                    channel_id: channelId,
                    user_id: userId,
                    err: err
                })}`);
            }
        }
    );

function saveNewActionItem(description: string, workspaceId: string, channelId: string, ownerId: string): (dependencies: AppDependencies) => Promise<void> {
    return async ({pool}: AppDependencies) => {
        await pool.query({
            text: `INSERT INTO action_items(description, workspace_id, channel_id, owner) VALUES($1, $2, $3, $4)`,
            values: [description, workspaceId, channelId, ownerId],
        });
    };
}

function updateMenu(responseUrl: string, blocks: (Block)[]): (dependencies: AppDependencies) => Promise<void> {
    return (dependencies: AppDependencies) => {
        const options = {
            method: 'POST',
            uri: responseUrl,
            headers: {
                'Content-type': 'application/json; charset=utf-8',
            },
            body: {
                replace_original: "true",
                blocks: blocks
            },
            json: true
        };

        return dependencies.rp(options)
            .then(res => res);
    };
}
