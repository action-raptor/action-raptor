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

    const responseBody = {
        response_type: "in_channel",
        blocks: [
            markdownSection(`Okay!!!!!! I've recorded your action item. commandType=${commandType}`),
        ]
    };

    response.status(200).send({...responseBody});
});

export const commands = functions.https.onRequest(commandsApp);
