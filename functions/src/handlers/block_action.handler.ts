import {addItemModal} from "../view";
import * as admin from "firebase-admin";
import * as express from "express";
import * as rp from "request-promise";
import * as functions from "firebase-functions";
import {getActionItemMenu, getActionItemsPublic} from "../menu";
import {Block} from "@slack/types";

export const blockActionHandler = (firestore: admin.firestore.Firestore) => {
    return (request: express.Request, response: express.Response) => {
        const payload = JSON.parse(request.body.payload);

        switch (payload.type) {
            case "block_actions":
                routeBlockActions(payload, response, firestore);
                break;
            case "view_submission":
                handleAddActionItem(payload, response, firestore);
                break;
            default:
                console.error("received unknown payload type");
                response.status(200).send();
        }
    }
};

function routeBlockActions(payload: any, response: express.Response, firestore: admin.firestore.Firestore) {
    if (payload.actions.length < 1) {
        console.error("got a block action payload with no actions");
        response.status(200).send();
    }

    const actionId = payload.actions[0].action_id;

    if (actionId === "add_action_item") {
        handleAddClicked(payload, response)
    } else if (actionId === "post_to_channel") {
        handlePost(payload, response, firestore);
    } else if (actionId.includes("complete")) {
        const docId = actionId.split(":")[1];
        handleCompleteAction(payload, response, firestore, docId);
    }
}

function handlePost(payload: any, response: express.Response, firestore: admin.firestore.Firestore) {
    console.log(`handling post to channel`);

    response.status(200).send();

    const collectionPath = `workspace/${payload.team.id}/channel/${payload.channel.name}/items`;
    getActionItemsPublic(collectionPath, firestore)
        .then(blocks => {
            console.log(`fetched action items`);

            return firestore.collection(`bot_token`).doc(payload.team.id).get()
                .then(tokenDoc => {
                    console.log(`fetched bot token`);
                    const options = {
                        method: 'POST',
                        uri: `https://slack.com/api/chat.postMessage`,
                        headers: {
                            'Content-type': 'application/json',
                            Authorization: `Bearer ${tokenDoc.data()?.value}`
                        },
                        body: {
                            channel: payload.channel.id,
                            blocks: blocks
                        },
                        json: true
                    };

                    return rp(options);
                }).catch(e => {
                    return Promise.reject(`whoops: ${e}`);
                });
        })
        .then((resp) => {
            console.log(`got a response from slack: ${JSON.stringify(resp)}`);
        })
        .catch(err => {
            console.log(`error: ${err}`)
        });
}

function handleAddClicked(payload: any, response: express.Response) {
    console.log(`handling add action item clicked ${JSON.stringify(payload)}`);
    response.status(200).send();

    const metadata = JSON.stringify({
        channel_name: payload.channel.name,
        response_url: payload.response_url
    });

    const options = {
        method: 'POST',
        uri: 'https://slack.com/api/views.open',
        headers: {
            'Content-type': 'application/json',
            'Authorization': `Bearer ${functions.config().slack.access_token}`
        },
        body: {
            trigger_id: payload.trigger_id,
            view: addItemModal(metadata)
        },
        json: true
    };

    rp(options)
        .then((resp: any) => {
            console.log(`got response from slack: ${JSON.stringify(resp)}`);
        })
        .catch((err: any) => {
            console.log(`request failed: ${JSON.stringify(err)}`);
        });
}

function handleAddActionItem(payload: any, response: express.Response, firestore: admin.firestore.Firestore) {
    console.log(`handling add action item: ${JSON.stringify(payload)}`);

    const metadata = JSON.parse(payload.view.private_metadata);

    const channelName = metadata.channel_name.toString();
    const workspaceId = payload.team.id.toString();
    const itemDescription = payload.view.state.values.item_description.title.value.toString();

    const collectionPath = `workspace/${workspaceId}/channel/${channelName}/items`;
    firestore.collection(`${collectionPath}`).add({
        "description": itemDescription
    }).then(() => {
        console.log("action item saved");
        return getActionItemMenu(collectionPath, firestore)
    }).then((blocks) => {
        return updateMenu(metadata.response_url, blocks)
    }).catch(err => {
        console.error(`error saving action item: ${err}`);
    });

    response.status(200).send();
}

function handleCompleteAction(payload: any, response: express.Response, firestore: admin.firestore.Firestore, actionId: string) {
    console.log(`handling complete action: ${JSON.stringify(payload)}`);

    const collectionPath = `workspace/${payload.team.id}/channel/${payload.channel.name}/items`;
    response.status(200).send();

    firestore.collection(collectionPath).doc(actionId)
        .delete()
        .then(() => {
            console.log(`deleted action ${actionId} from ${collectionPath}`);
            return getActionItemMenu(collectionPath, firestore);
        })
        .then((blocks) => {
            console.log(`fetched them items`);
            return updateMenu(payload.response_url, blocks)
        })
        .then((resp) => {
            console.log(`sent a thing to slack ${resp}`)
        })
        .catch(err => {
            console.error(`error in complete flow: ${err}`);
        });
}

function updateMenu(response_url: string, blocks: (Block)[]) {
    const options = {
        method: 'POST',
        uri: response_url,
        headers: {
            'Content-type': 'application/json',
        },
        body: {
            replace_original: "true",
            blocks: blocks
        },
        json: true
    };

    return rp(options);
}