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
    console.log(request.body);

    const fullCommandText = request.body.text.toString();
    const commandType = fullCommandText.split(" ")[0];

    switch (commandType) {
        case "add":
            handleAdd(request, response);
            break;
        case "list":
            handleList(response);
            break;
        default:
            handleHelp(response);
    }
});

function handleAdd(request: express.Request, response: express.Response) {
    const channelId = request.body.channel_name.toString();

    const actionItemDocRef = firestore.collection("channels").doc(`${channelId}`).collection("items").doc();
    actionItemDocRef.set({
        "hello": "firebase"
    });



    const responseBody = {
        response_type: "in_channel",
        blocks: [
            markdownSection(`Okay! I've recorded your action item.`),
        ]
    };

    response.status(200).send({...responseBody});
}

function handleList(response: express.Response) {
    const responseBody = {
        response_type: "in_channel",
        blocks: [
            markdownSection(`Okay! Here's a list: [1, 2, 3]`),
        ]
    };

    response.status(200).send({...responseBody});
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
