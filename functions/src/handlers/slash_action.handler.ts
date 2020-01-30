import {editableActionLine, helpSection, listFooter, markdownSection} from "../view";
import * as admin from "firebase-admin";
import * as express from "express";


export const slashActionHandler = (firestore: admin.firestore.Firestore) => {
    return (request: express.Request, response: express.Response) => {
        console.log(`/action request: ${JSON.stringify(request.body)}`);

        const fullCommandText = request.body.text.toString();
        const commandType = fullCommandText.split(" ")[0];

        switch (commandType) {
            case "add":
                handleAdd(request, response, firestore);
                break;
            case "":
                handleList(request, response, firestore);
                break;
            default:
                handleHelp(response);
        }
    }
};

function handleAdd(request: express.Request, response: express.Response, firestore: admin.firestore.Firestore) {
    const channelId = request.body.channel_name.toString();
    const workspaceId = request.body.team_id.toString();

    const fullCommandText = request.body.text.toString();
    const itemDescription = fullCommandText.substr(fullCommandText.indexOf(" ") + 1);

    firestore.collection("workspace").doc(workspaceId).collection("channel").doc(channelId).collection("items").add({
        "description": itemDescription
    }).then(() => {
        console.log("action item saved");
    }).catch(err => {
        console.error(`error saving action item: ${err}`);
    });

    const responseBody = {
        blocks: [
            markdownSection(`Okay! I've recorded your action item.`),
        ]
    };

    response.status(200).send({...responseBody});
}

function handleList(request: express.Request, response: express.Response, firestore: admin.firestore.Firestore) {
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

function handleHelp(response: express.Response) {
    const responseBody = {
        blocks: [
            helpSection(),
        ]
    };

    response.status(200).send({...responseBody});
}
