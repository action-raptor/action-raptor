import {divider, markdownSection} from "../view";
import * as admin from "firebase-admin";
import * as express from "express";
import {getActionItemMenu} from "../menu";

export const slashActionHandler = (firestore: admin.firestore.Firestore) => {
    return (request: express.Request, response: express.Response) => {
        const fullCommandText = request.body.text.toString();
        const commandType = fullCommandText.split(" ")[0];

        if (commandType === "post") {
            handlePost(request, response, firestore);
        } else {
            handleMenu(request, response, firestore);
        }

    };
};

function handleMenu(request: express.Request, response: express.Response, firestore: admin.firestore.Firestore) {
    console.log("handling menu");

    const channelId = request.body.channel_name.toString();
    const workspaceId = request.body.team_id.toString();

    getActionItemMenu(`workspace/${workspaceId}/channel/${channelId}/items`, firestore)
        .then((blocks) => {
            return response.status(200).send({
                blocks: blocks
            });
        })
        .catch(err => {
            console.error(`error fetching items: ${err}`);
            response.status(200).send({
                blocks: [
                    markdownSection(`something went wrong...`),
                ]
            });
        });
}

function handlePost(request: express.Request, response: express.Response, firestore: admin.firestore.Firestore) {
    console.log(`handling post items`);
    const channelName = request.body.channel_name.toString();
    const workspaceId = request.body.team_id.toString();

    firestore.collection(`workspace/${workspaceId}/channel/${channelName}/items`)
        .get()
        .then((snapshot) => {
            const itemBlocks = snapshot.docs.map((doc) => {
                return markdownSection(`${doc.data().description}`);
            });

            const responseBody = {
                response_type: "in_channel",
                blocks: [
                    markdownSection("Here are all open action items:"),
                    divider(),
                    ...itemBlocks
                ]
            };

            response.status(200).send(responseBody);
        })
        .catch(err => {
            console.error(`error fetching items: ${err}`);
            response.status(200).send({
                blocks: [
                    markdownSection(`something went wrong...`),
                ]
            });
        });
}
