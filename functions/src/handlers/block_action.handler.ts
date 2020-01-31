import {addItemModal, divider, editableActionLine, listFooter, markdownSection} from "../view";
import * as admin from "firebase-admin";
import * as express from "express";
import * as rp from "request-promise";
import * as functions from "firebase-functions";

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
    } else if (actionId.includes("complete")) {
        const docId = actionId.split(":")[1];
        handleCompleteAction(payload, response, firestore, docId);
    }
}

function handleAddActionItem(payload: any, response: express.Response, firestore: admin.firestore.Firestore) {
    console.log("handling add action item");

    const channelName = payload.view.callback_id.toString();
    const workspaceId = payload.team.id.toString();
    const itemDescription = payload.view.state.values.item_description.title.value.toString();

    firestore.collection(`workspace/${workspaceId}/channel/${channelName}/items`).add({
        "description": itemDescription
    }).then(() => {
        console.log("action item saved");
    }).catch(err => {
        console.error(`error saving action item: ${err}`);
    });

    response.status(200).send();
}

function handleAddClicked(payload: any, response: express.Response) {
    console.log("handling add action item clicked");
    response.status(200).send();

    const options = {
        method: 'POST',
        uri: 'https://slack.com/api/views.open',
        headers: {
            'Content-type': 'application/json',
            'Authorization': `Bearer ${functions.config().slack.access_token}`
        },
        body: {
            trigger_id: payload.trigger_id,
            view: addItemModal(payload.channel.name)
        },
        json: true // Automatically parses the JSON string in the response
    };

    rp(options)
        .then((resp: any) => {
            console.log(`got response from slack: ${JSON.stringify(resp)}`);
        })
        .catch((err: any) => {
            console.log(`request failed: ${JSON.stringify(err)}`);
        });
}

function handleCompleteAction(payload: any, response: express.Response, firestore: admin.firestore.Firestore, actionId: string) {
    console.log(`handling complete action: ${JSON.stringify(payload)}`);

    const collectionPath = `workspace/${payload.team.id}/channel/${payload.channel.name}/items`;
    response.status(200).send();

    firestore.collection(collectionPath).doc(actionId)
        .delete()
        .then(() => {
            console.log(`deleted action ${actionId} from ${collectionPath}`);
            return firestore.collection(collectionPath).get();
        })
        .then((snapshot) => {
            console.log(`fetched them items`);
            const itemBlocks = snapshot.docs.map((doc) => {
                return editableActionLine(`${doc.data().description}`, doc.id);
            });

            const options = {
                method: 'POST',
                uri: payload.response_url,
                headers: {
                    'Content-type': 'application/json',
                },
                body: {
                    replace_original: "true",
                    blocks: [
                        markdownSection("Here are all open action items:"),
                        divider(),
                        ...itemBlocks,
                        listFooter()
                    ]
                },
                json: true
            };

            return rp(options);
        })
        .then((resp) => {
            console.log(`sent a thing to slack ${resp}`)
        })
        .catch(err => {
            console.error(`error in complete flow: ${err}`);
        });
}