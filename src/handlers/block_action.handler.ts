import * as express from "express";
import * as rp from "request-promise";
import {fetchToken, postToChannel} from "../slack_api";
import {Client} from "pg";
import {addItemModal, markdownSection} from "../view";
import {getActionItemMenu, getActionItemsPublic} from "../menu";
import {Block} from "@slack/types";

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
        handleAddClicked(payload, response, client)
    } else if (actionId === "post_to_channel") {
        handlePost(payload, response, client);
    } else if (actionId.includes("complete")) {
        const docId = actionId.split(":")[1];
        handleCompleteAction(payload, response, docId, client);
    }
}

function handlePost(payload: any, response: express.Response, client: Client) {
    console.log(`handling post to channel ${JSON.stringify(payload)}`);

    const workspaceId = payload.team.id;
    const channelId = payload.channel.id;
    getActionItemsPublic(workspaceId, channelId, client)
        .then(blocks => {
            console.log(`fetched action items`);
            return postToChannel(workspaceId, channelId, blocks, client);
        })
        .then((resp) => {
            console.log(`got a response from slack: ${JSON.stringify(resp)}`);
        })
        .catch(err => {
            console.log(`error: ${err}`)
        });

    response.status(200).send();
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

    const metadata = JSON.parse(payload.view.private_metadata);

    const workspaceId = metadata.workspace_id.toString();
    const channelId = metadata.channel_id.toString();
    const itemDescription = payload.view.state.values.item_description.title.value.toString();

    const queryText = "INSERT INTO action_items(description, workspace_id, channel_id) VALUES($1, $2, $3)";
    const queryValues = [itemDescription, workspaceId, channelId];

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

function handleCompleteAction(payload: any, response: express.Response, actionId: string, client: Client) {
    console.log(`handling complete action: ${JSON.stringify(payload)}`);

    const workspaceId = payload.team.id;
    const channelId = payload.channel.id;
    const username = payload.user.name;

    const queryText = "DELETE FROM action_items WHERE id=$1";
    const queryValues = [actionId];

    let itemDescription = "an item";

    client.query('select * from action_items where id=$1', [actionId])
        .then(res => {
            itemDescription = res.rows[0].description;
            return client.query(queryText, queryValues);
        })
        .then(() => {
            console.log(`deleted action. action_id=${actionId}. channel_id=${channelId}. workspace_id=${workspaceId}`);
            return getActionItemMenu(workspaceId, channelId, client);
        })
        .then(blocks => {
            return updateMenu(payload.response_url, blocks);
        })
        .then((resp) => {
            console.log(`update menu response: ${JSON.stringify(resp)}`);
            return postToChannel(workspaceId, channelId, [markdownSection(`${username} completed "${itemDescription}"`)], client);
        })
        .catch(err => {
            console.error(`error in complete flow: ${err}`);
        });

    response.status(200).send();
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