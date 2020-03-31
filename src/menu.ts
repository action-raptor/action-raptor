import {Client} from "pg";
import {divider, editableActionLine, listFooter, markdownSection} from "./view";

export const getActionItemMenu = (workspaceId: string, channelId: string, client: Client) => {
    const query = {
        text: "SELECT * FROM action_items WHERE workspace_id = $1 AND channel_id = $2",
        values: [workspaceId, channelId]
    };

    return client.query(query)
        .then(res => {
            const itemBlocks = res.rows.map((row) => {
                return editableActionLine(row.description, row.id);
            });

            return [
                markdownSection("Open action items:"),
                divider(),
                ...itemBlocks,
                listFooter()
            ];
        });
};

export const getActionItemsPublic = (workspaceId: string, channelId: string, client: Client) => {
    const query = {
        text: "SELECT * FROM action_items WHERE workspace_id = $1 AND channel_id = $2",
        values: [workspaceId, channelId]
    };

    return client.query(query)
        .then(res => {
            const itemBlocks = res.rows.map((row) => {
                return markdownSection(row.description);
            });

            return [
                markdownSection("Here are all open action items:"),
                divider(),
                ...itemBlocks
            ];
        });
};
