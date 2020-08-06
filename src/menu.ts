import {Client} from "pg";
import {divider, editableActionLine, listFooter, markdownSection, menuHeader} from "./view";

export const getActionItemMenu = (workspaceId: string, channelId: string, client: Client) => {
    const query = {
        text: "SELECT * FROM action_items WHERE workspace_id = $1 AND channel_id = $2 AND status='OPEN'",
        values: [workspaceId, channelId]
    };

    return client.query(query)
        .then(res => {
            console.log(`retrieved ${res.rows.length} items for channel menu`);

            const itemBlocks = res.rows.map((row) => {
                const text = row.owner
                    ? `${row.description} - <@${row.owner}>`
                    : `${row.description}`;
                return editableActionLine(text, row.id);
            });

            return [
                menuHeader(),
                divider(),
                ...itemBlocks,
                listFooter()
            ];
        });
};

export const getActionItemsPublic = (workspaceId: string, channelId: string, client: Client) => {
    const query = {
        text: "SELECT * FROM action_items WHERE workspace_id = $1 AND channel_id = $2 AND status='OPEN'",
        values: [workspaceId, channelId]
    };

    return client.query(query)
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
