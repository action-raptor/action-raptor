import * as express from "express";
import {Client} from "pg";
import {markdownSection} from "../view";
import {getActionItemMenu} from "../menu";

export const slashActionHandler = (client: Client) => {
    return (request: express.Request, response: express.Response) => {
        console.log(`handling menu ${JSON.stringify(request.body)}`);

        const workspaceId = request.body.team_id.toString();
        const channelId = request.body.channel_id.toString();

        getActionItemMenu(workspaceId, channelId, client)
            .then((blocks: any) => {
                return response.status(200).send({
                    blocks: blocks
                });
            })
            .catch((err: any) => {
                console.error(`error fetching items: ${err}`);
                response.status(200).send({
                    blocks: [
                        markdownSection(`something went wrong...`),
                    ]
                });
            });

    };
};