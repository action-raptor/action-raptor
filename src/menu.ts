import {Block} from "@slack/types";
import {divider, editableActionLine, listFooter, markdownSection} from "./view";
import {OpenActionItem} from "./model.action_item";
import {AppDependencies} from "./app";
import {Reader} from "fp-ts/lib/Reader";

export const getActionItemMenu = async (workspaceId: string, channelId: string, dependencies: AppDependencies): Promise<Block[]> => {
    const openActionItems = await fetchOpenActionItems(workspaceId, channelId).run(dependencies);

    const itemBlocks = openActionItems
        .map((item) => {
            const text = item.owner
                ? `${item.description} - <@${item.owner}>`
                : `${item.description}`;
            return editableActionLine(text, item.id);
        });

    return [
        markdownSection("Open action items:"),
        divider(),
        ...itemBlocks,
        listFooter()
    ];
};

export const getActionItemsPublic = async (workspaceId: string, channelId: string, dependencies: AppDependencies): Promise<Block[]> => {
    const openActionItems = await fetchOpenActionItems(workspaceId, channelId).run(dependencies);

    const itemBlocks = openActionItems
        .map(item =>
            item.owner
                ? `${item.description} - <@${item.owner}>`
                : `${item.description}`
        )
        .map(text => markdownSection(text));

    return [
        markdownSection("Here are all open action items:"),
        divider(),
        ...itemBlocks
    ];
};

const fetchOpenActionItems = (workspaceId: string, channelId: string): Reader<AppDependencies, Promise<OpenActionItem[]>> =>
    new Reader<AppDependencies, Promise<OpenActionItem[]>>(async ({pool}) => {
            const result = await pool.query({
                text: "SELECT * FROM action_items WHERE workspace_id = $1 AND channel_id = $2 AND status='OPEN'",
                values: [workspaceId, channelId]
            });
            return result.rows;
        }
    );
