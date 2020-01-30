import {markdownSection} from "../view";
import * as admin from "firebase-admin";
import * as express from "express";

export const blockActionHandler = (firestore: admin.firestore.Firestore) => {
    return (request: express.Request, response: express.Response) => {
        console.log("handling block action");
        const payload = JSON.parse(request.body.payload);
        if (payload.actions.length < 1) {
            console.error("got a block action payload with no actions")
            response.status(200).send();
        }

        const actionId = payload.actions[0].action_id;

        if (actionId === "add_action_item") {
            handleAddClicked(request, response)
        } else if (actionId.includes("complete")) {
            const docId = actionId.split(":")[1];
            handleCompleteAction(payload, response, firestore, docId);
        }
    }
};

function handleAddClicked(request: express.Request, response: express.Response) {
    console.log("handling add action item");
    response.status(200).send();
}

function handleCompleteAction(payload: any, response: express.Response, firestore: admin.firestore.Firestore, actionId: string) {
    const collectionPath = `workspace/${payload.team.id}/channel/${payload.channel.name}/items`;

    firestore.collection(collectionPath).doc(actionId)
        .delete()
        .then(() => {
            console.log(`deleted action ${actionId} from ${collectionPath}`);

            const responseBody = {
                response_type: "in_channel",
                blocks: markdownSection("deleted the item")
            };
            response.status(200).send({...responseBody});
        })
        .catch(err => {
            console.error(`error fetching items: ${err}`);
        });
}