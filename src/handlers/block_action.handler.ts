import * as express from "express";
import * as rp from "request-promise";
import {fetchToken, deleteMessage, postToChannel} from "../slack_api";
import {Client} from "pg";
import {addItemModal, markdownSection} from "../view";
import {getActionItemMenu, getActionItemsPublic} from "../menu";
import {Block} from "@slack/types";
import {nonsenseModal} from "../settings/settings.view";

export const blockActionHandler = (client: Client) => {
    return (request: express.Request, response: express.Response) => {
        const payload = JSON.parse(request.body.payload);

        switch (payload.type) {
            case "block_actions":
                routeBlockActions(payload, response, client);
                break;
            case "view_submission":
                handleAddActionItem(payload, response, client);
                break;
            default:
                console.error("received unknown payload type");
                response.status(200).send();
        }
    }
};

function routeBlockActions(payload: any, response: express.Response, client: Client) {
    if (payload.actions.length < 1) {
        console.error("got a block action payload with no actions");
        response.status(200).send();
    }

    const actionId = payload.actions[0].action_id;

    if (actionId === "add_action_item") {
        handleAddClicked(payload, response, client);
    } else if (actionId === "post_to_channel") {
        handlePost(payload, response, client);
    } else if (actionId === "open_settings") {
        handleOpenSettings(payload, response, client);
    } else if (actionId === "close_menu") {
        handleCloseClicked(payload, response);
    } else if (actionId.includes("complete")) {
        const docId = actionId.split(":")[1];
        handleCompleteAction(payload, response, docId, client)
            .catch(err => {
                console.error(`error in complete flow: ${err}`);
            });
    }
}

function handlePost(payload: any, response: express.Response, client: Client) {
    console.log(`handling post to channel ${JSON.stringify(payload)}`);

    const workspaceId = payload.team.id;
    const channelId = payload.channel.id;
    const responseUrl = payload.response_url;

    getActionItemsPublic(workspaceId, channelId, client)
        .then(blocks => {
            console.log(`fetched action items`);
            return postToChannel(workspaceId, channelId, blocks, client);
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

function handleOpenSettings(payload: any, response: express.Response, client: Client) {
    console.log("handling open settings");
    response.status(200).send();

    fetchToken(payload.team.id, client)
        .then((token) => {
            const options = {
                method: 'POST',
                uri: 'https://slack.com/api/views.open',
                headers: {
                    'Content-type': 'application/json; charset=utf-8',
                    'Authorization': `Bearer ${token}`
                },
                body: {
                    trigger_id: payload.trigger_id,
                    view: nonsenseModal()
                },
                json: true
            };

            return rp(options)
                .then((resp) => {
                    console.log(JSON.stringify(resp));
                    return resp;
                });
        });
}

function handleAddClicked(payload: any, response: express.Response, client: Client) {
    console.log(`handling add action item clicked ${JSON.stringify(payload)}`);
    response.status(200).send();

    const metadata = JSON.stringify({
        workspace_id: payload.team.id,
        channel_id: payload.channel.id,
        response_url: payload.response_url
    });

    fetchToken(payload.team.id, client)
        .then((token) => {
            const options = {
                method: 'POST',
                uri: 'https://slack.com/api/views.open',
                headers: {
                    'Content-type': 'application/json; charset=utf-8',
                    'Authorization': `Bearer ${token}`
                },
                body: {
                    trigger_id: payload.trigger_id,
                    view: addItemModal(metadata)
                },
                json: true
            };

            return rp(options);
        })
        .then((resp: any) => {
            console.log(`got response from slack: ${JSON.stringify(resp)}`);
        })
        .catch((err: any) => {
            console.log(`request failed: ${JSON.stringify(err)}`);
        });
}

function handleAddActionItem(payload: any, response: express.Response, client: Client) {
    console.log(`handling add action item: ${JSON.stringify(payload)}`);

    const owner = payload.view.state.values.owner_select?.selected_item_owner?.selected_user;

    const metadata = JSON.parse(payload.view.private_metadata);

    const workspaceId = metadata.workspace_id.toString();
    const channelId = metadata.channel_id.toString();
    const itemDescription = payload.view.state.values.item_description.title.value.toString();
    const itemStatus = 'OPEN';

    const queryText = "INSERT INTO action_items(description, workspace_id, channel_id, owner, status) VALUES($1, $2, $3, $4, $5)";
    const queryValues = [itemDescription, workspaceId, channelId, owner, itemStatus];

    client.query(queryText, queryValues)
        .then(() => {
            console.log("action item saved");
            return getActionItemMenu(workspaceId, channelId, client);
        })
        .then(blocks => {
            return updateMenu(metadata.response_url, blocks);
        })
        .catch(err => {
            console.error(`error saving action item: ${err}`);
        });

    response.status(200).send();
}

async function handleCompleteAction(payload: any, response: express.Response, actionId: string, client: Client) {
    console.log(`handling complete action: ${JSON.stringify(payload)}`);
    response.status(200).send();

    const workspaceId = payload.team.id;
    const channelId = payload.channel.id;
    const username = payload.user.name;

    const findResult = await client.query('select * from action_items where id=$1', [actionId]);
    const itemDescription = findResult.rows[0].description;


    const now = new Date();
    await client.query("UPDATE action_items SET status='COMPLETED', closed_at=$1 WHERE id=$2", [now, actionId]);
    console.log(`completed action. action_id=${actionId}. channel_id=${channelId}. workspace_id=${workspaceId}`);

    const blocks = await getActionItemMenu(workspaceId, channelId, client);
    const updateResp = await updateMenu(payload.response_url, blocks);
    console.log(`update menu response: ${JSON.stringify(updateResp)}`);

    return await postToChannel(workspaceId, channelId, [markdownSection(`${username} completed "${itemDescription}"`)], client);
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