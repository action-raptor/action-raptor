import {markdownSection} from "../view";
import * as admin from "firebase-admin";
import * as express from "express";

export const blockActionHandler = (firestore: admin.firestore.Firestore) => {
    return (request: express.Request, response: express.Response) => {
        console.log("handling block action");

        const payload = JSON.parse(request.body.payload);

        payload.actions.forEach((action: any) => {
            const actionId = action.action_id.split(":")[1];
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
                    response.status(200).send();
                });
        });
    }
};