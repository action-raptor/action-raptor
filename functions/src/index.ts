import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";
import {SectionBlock} from "@slack/types";

import * as admin from "firebase-admin";

admin.initializeApp();

const firestore: admin.firestore.Firestore = admin.firestore();

const markdownSection = (text: string): SectionBlock => {
    return ({
        type: "section",
        text: {
            type: "mrkdwn",
            text: text
        }
    });
};

//
// Command endpoints
//

const commandsApp: express.Application = express();
commandsApp.use(cors({origin: true}));
commandsApp.post("/action", (request: express.Request, response: express.Response) => {
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
                return markdownSection(`${doc.data().description}`);
            });

            const allBlocks = [markdownSection("Here are all open action items:")].concat(itemBlocks);

            const responseBody = {
                response_type: "in_channel",
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
            markdownSection(helpText),
        ]
    };

    response.status(200).send({...responseBody});
}

const helpText = `usage: /action <command> <options>

Add an action item:
    /action add <item description and owner>
    
List outstanding action items:
    /action list
`;

export const commands = functions.https.onRequest(commandsApp);
