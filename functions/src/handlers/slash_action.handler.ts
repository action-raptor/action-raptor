import {divider, editableActionLine, listFooter, markdownSection} from "../view";
import * as admin from "firebase-admin";
import * as express from "express";

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

    firestore.collection(`workspace/${workspaceId}/channel/${channelId}/items`)
        .get()
        .then((snapshot) => {
            const itemBlocks = snapshot.docs.map((doc) => {
                return editableActionLine(`${doc.data().description}`, doc.id);
            });

            const responseBody = {
                blocks: [
                    markdownSection("Here are all open action items:"),
                    divider(),
                    ...itemBlocks,
                    listFooter()
                ]
            };

            response.status(200).send({...responseBody});
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

            response.status(200).send({
                response_type: "in_channel",
                blocks: [
                    markdownSection("Here are all open action items:"),
                    divider(),
                    ...itemBlocks
                ]
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
