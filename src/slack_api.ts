import {Block} from "@slack/types";
import * as rp from "request-promise";
import {Pool} from "pg";

export const postToChannel = (workspaceId: string, channelId: string, blocks: (Block)[], pool: Pool) => {
    return fetchToken(workspaceId, pool)
        .then(token => {
            console.log(`fetched bot token`);
            const options = {
                method: 'POST',
                uri: `https://slack.com/api/chat.postMessage`,
                headers: {
                    'Content-type': 'application/json; charset=utf-8',
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

const fetchToken = (workspaceId: string, pool: Pool) => {
    const query = {
        text: "SELECT * FROM slack_tokens WHERE workspace_id = $1",
        values: [workspaceId]
    };

    return pool.query(query)
        .then(res => {
            return res.rows[0]?.value;
        });
};
