import {Client} from "pg";
import {divider, editableActionLine, listFooter, markdownSection} from "./view";

export const getActionItemMenu = (channelId: string, client: Client) => {
    const query = {
        text: "SELECT * FROM action_item WHERE channel_id = $1",
        values: [channelId]
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

export const getActionItemsPublic = (channelId: string, client: Client) => {
    const query = {
        text: "SELECT * FROM action_item WHERE channel_id = $1",
        values: [channelId]
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
