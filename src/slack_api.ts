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

export const publishHomeView = async (userId: string, workspaceId: string, pool: Pool, blocks: any[]) => {
    const token = await fetchToken(workspaceId, pool);
    const options = {
        method: 'POST',
        uri: `https://slack.com/api/views.publish`,
        headers: {
            'Content-type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: {
            user_id: userId,
            view: {
                type: "home",
                blocks: blocks
            }
        },
        json: true
    };

    return rp(options);
};

export const fetchToken = (workspaceId: string, pool: Pool) => {
    const query = {
        text: "SELECT * FROM slack_tokens WHERE workspace_id = $1",
        values: [workspaceId]
    };

    return pool.query(query)
        .then(res => {
            return res.rows[0]?.value;
        });
};

export const deleteMessage = (responseUrl: string) => {
    const options = {
        method: 'POST',
        uri: responseUrl,
        headers: {
            'Content-type': 'application/json; charset=utf-8',
        },
        body: {
            delete_original: "true"
        },
        json: true
    };

    rp(options);
};
