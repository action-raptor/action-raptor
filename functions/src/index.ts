import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";

import * as admin from "firebase-admin";
import {editableActionLine, helpSection, markdownSection} from "./view";

admin.initializeApp();

const firestore: admin.firestore.Firestore = admin.firestore();

const commandsApp: express.Application = express();
commandsApp.use(cors({origin: true}));
commandsApp.post("/action", (request: express.Request, response: express.Response) => {
    console.log(`/action request: ${JSON.stringify(request.body)}`);

    const fullCommandText = request.body.text.toString();
    const commandType = fullCommandText.split(" ")[0];

    switch (commandType) {
        case "add":
            handleAdd(request, response);
            break;
        case "list":
            handleList(request, response);
            break;
        default:
            handleHelp(response);
    }
});

function handleAdd(request: express.Request, response: express.Response) {
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
        response_type: "in_channel",
        blocks: [
            markdownSection(`Okay! I've recorded your action item.`),
        ]
    };

    response.status(200).send({...responseBody});
}

function handleList(request: express.Request, response: express.Response) {
    const channelId = request.body.channel_name.toString();
    const workspaceId = request.body.team_id.toString();

    firestore.collection(`workspace/${workspaceId}/channel/${channelId}/items`)
        .get()
        .then((snapshot) => {
            const itemBlocks = snapshot.docs.map((doc) => {
                console.log(`doc id: ${doc.id}`)
                return editableActionLine(`${doc.data().description}`, doc.id);
            });

            const allBlocks = [markdownSection("Here are all open action items:")]
                .concat(itemBlocks);

            const responseBody = {
                blocks: allBlocks
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


commandsApp.post("/action/block", (request: express.Request, response: express.Response) => {
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
});


export const commands = functions.https.onRequest(commandsApp);
