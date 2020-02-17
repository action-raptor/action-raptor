import {Block} from "@slack/types";
import * as rp from "request-promise";
import {Client} from "pg";

export const postToChannel = (workspaceId: string, channelId: string, blocks: (Block)[], client: Client) => {
    return fetchToken(workspaceId, client)
        .then(token => {
            console.log(`fetched bot token`);
            const options = {
                method: 'POST',
                uri: `https://slack.com/api/chat.postMessage`,
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: {
                    channel: channelId,
                    blocks: blocks
                },
                json: true
            };

            return rp(options);
        });
};

export const fetchToken = (workspaceId: string, client: Client) => {
    const query = {
        text: "SELECT * FROM token WHERE workspace = $1",
        values: [workspaceId]
    };

    return client.query(query)
        .then(res => {
            return res.rows[0]?.value;
        });
};