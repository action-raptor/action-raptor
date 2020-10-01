import {Block} from "@slack/types";
import * as express from "express";
import * as rp from "request-promise";
import {Pool} from "pg";
import {deleteMessage, postToChannel} from "../slack_api";
import {markdownSection} from "../view";
import {getActionItemMenu, getActionItemsPublic} from "../menu";

export const blockActionHandler = (pool: Pool) => {
    return (request: express.Request, response: express.Response) => {
        const payload = JSON.parse(request.body.payload);

        switch (payload.type) {
            case "block_actions":
                routeBlockActions(payload, response, pool);
                break;
            case "view_submission":
                handleAddActionItem(payload, response, pool);
                break;
            default:
                console.error("received unknown payload type");
                response.status(200).send();
        }
    }
};

function routeBlockActions(payload: any, response: express.Response, pool: Pool) {
    if (payload.actions.length < 1) {
        console.error("got a block action payload with no actions");
        response.status(200).send();
    }

    const actionId = payload.actions[0].action_id;

    if (actionId === "post_to_channel") {
        handlePost(payload, response, pool);
    } else if (actionId === "close_menu") {
        handleCloseClicked(payload, response);
    } else if (actionId.includes("complete")) {
        const docId = actionId.split(":")[1];
        handleCompleteAction(payload, response, docId, pool)
            .catch(err => {
                console.error(`error in complete flow: ${err}`);
            });
    }
}

function handlePost(payload: any, response: express.Response, pool: Pool) {
    console.log(`handling post to channel ${JSON.stringify(payload)}`);

    const workspaceId = payload.team.id;
    const channelId = payload.channel.id;
    const responseUrl = payload.response_url;

    getActionItemsPublic(workspaceId, channelId, pool)
        .then(blocks => {
            console.log(`fetched action items`);
            return postToChannel(workspaceId, channelId, blocks, pool);
        })
        .then((resp) => {
            console.log(`got a response from slack: ${JSON.stringify(resp)}`);
            deleteMessage(responseUrl);
        })
        .catch(err => {
            console.log(`error: ${err}`);
        });

    response.status(200).send();
}

function handleAddActionItem(payload: any, response: express.Response, pool: Pool) {
    console.log(`handling add action item: ${JSON.stringify(payload)}`);

    const owner = payload.view.state.values.owner_select?.selected_item_owner?.selected_user;

    const metadata = JSON.parse(payload.view.private_metadata);

    const workspaceId = metadata.workspace_id.toString();
    const channelId = metadata.channel_id.toString();
    const itemDescription = payload.view.state.values.item_description.title.value.toString();
    const itemStatus = 'OPEN';

    const queryText = "INSERT INTO action_items(description, workspace_id, channel_id, owner, status) VALUES($1, $2, $3, $4, $5)";
    const queryValues = [itemDescription, workspaceId, channelId, owner, itemStatus];

    pool.query(queryText, queryValues)
        .then(() => {
            console.log("action item saved");
            return getActionItemMenu(workspaceId, channelId, pool);
        })
        .then(blocks => {
            return updateMenu(metadata.response_url, blocks);
        })
        .catch(err => {
            console.error(`error saving action item: ${err}`);
        });

    response.status(200).send();
}

async function handleCompleteAction(payload: any, response: express.Response, actionId: string, pool: Pool) {
    console.log(`handling complete action: ${JSON.stringify(payload)}`);
    response.status(200).send();

    const workspaceId = payload.team.id;
    const channelId = payload.channel.id;
    const username = payload.user.name;

    const findResult = await pool.query('select * from action_items where id=$1', [actionId]);
    const itemDescription = findResult.rows[0].description;


    const now = new Date();
    await pool.query("UPDATE action_items SET status='COMPLETED', closed_at=$1 WHERE id=$2", [now, actionId]);
    console.log(`completed action. action_id=${actionId}. channel_id=${channelId}. workspace_id=${workspaceId}`);

    const blocks = await getActionItemMenu(workspaceId, channelId, pool);
    const updateResp = await updateMenu(payload.response_url, blocks);
    console.log(`update menu response: ${JSON.stringify(updateResp)}`);

    return await postToChannel(workspaceId, channelId, [markdownSection(`${username} completed "${itemDescription}"`)], pool);
}

function handleCloseClicked(payload: any, response: express.Response) {
    console.log("handling close clicked");
    response.status(200).send();

    deleteMessage(payload.response_url);
}

function updateMenu(response_url: string, blocks: (Block)[]) {
    const options = {
        method: 'POST',
        uri: response_url,
        headers: {
            'Content-type': 'application/json; charset=utf-8',
        },
        body: {
            replace_original: "true",
            blocks: blocks
        },
        json: true
    };

    return rp(options);
}