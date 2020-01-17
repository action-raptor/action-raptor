import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";
import {SectionBlock} from "@slack/types";

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
    const commandType = fullCommandText.split(" ");
    // const responseUrl = request.body.response_url.toString();

    switch (commandType) {
        case "add":
            handleAdd(commandType, response);
            break;
        case "list":
            handleList(response);
            break;
        default:
            handleHelp(response);
    }
});

function handleAdd(commandType: string, response: express.Response) {
    const responseBody = {
        response_type: "in_channel",
        blocks: [
            markdownSection(`Okay!!!!!! I've recorded your action item. commandType=${commandType}`),
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
