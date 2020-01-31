import {divider, editableActionLine, listFooter, markdownSection} from "../view";
import * as admin from "firebase-admin";
import * as express from "express";

export const slashActionHandler = (firestore: admin.firestore.Firestore) => {
    return (request: express.Request, response: express.Response) => {
        console.log(`handling slash command`);
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
    };
};

