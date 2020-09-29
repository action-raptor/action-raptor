import {Block} from "@slack/types";
import {Pool} from "pg";
import {divider, editableActionLine, listFooter, markdownSection} from "./view";

export const getActionItemMenu = (workspaceId: string, channelId: string, pool: Pool): Promise<Block[]> => {
    const query = {
        text: "SELECT * FROM action_items WHERE workspace_id = $1 AND channel_id = $2 AND status='OPEN'",
        values: [workspaceId, channelId]
    };

    return pool.query(query)
        .then(res => {
            console.log(`retrieved ${res.rows.length} items for channel menu`);

            const itemBlocks = res.rows.map((row) => {
                const text = row.owner
                    ? `${row.description} - <@${row.owner}>`
                    : `${row.description}`;
                return editableActionLine(text, row.id);
            });

            return [
                markdownSection("Open action items:"),
                divider(),
                ...itemBlocks,
                listFooter()
            ];
        });
};

export const getActionItemsPublic = (workspaceId: string, channelId: string, pool: Pool): Promise<Block[]> => {
    const query = {
        text: "SELECT * FROM action_items WHERE workspace_id = $1 AND channel_id = $2 AND status='OPEN'",
        values: [workspaceId, channelId]
    };

    return pool.query(query)
        .then(res => {
            const itemBlocks = res.rows.map((row) => {
                const text = row.owner
                    ? `${row.description} - <@${row.owner}>`
                    : `${row.description}`;
                return markdownSection(text);
            });

            return [
                markdownSection("Here are all open action items:"),
                divider(),
                ...itemBlocks
            ];
        });
};
