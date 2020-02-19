import * as express from "express";
import {Client} from "pg";
import {markdownSection} from "../view";
import {getActionItemMenu} from "../menu";

export const slashActionHandler = (client: Client) => {
    return (request: express.Request, response: express.Response) => {
        console.log("handling menu");

        //TODO: switch to channel id
        const channelId = request.body.channel_name.toString();

        getActionItemMenu(channelId, client)
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