import {Client} from "pg";
import * as express from "express";
import {publishHomeView} from "../slack_api";
import {homeView, markdownSection} from "../view";

export const eventHandler = (client: Client) => {
    return (request: express.Request, response: express.Response) => {
        response.status(200).send();
        console.log(`handling event: ${JSON.stringify(request.body)}`);

        const event = request.body.event;
        if (event.type !== "app_home_opened") {
            return;
        }

        const userId = event.user;
        const workspaceId = request.body.team_id;

        updateHomeTab(userId, workspaceId, client)
            .catch(err => {
               console.log(`an error occurred handling events: ${err}`);
            });
    };
};

const updateHomeTab = async (userId: string, workspaceId: string, client: Client) => {
    const res = await client.query({
        text: "SELECT * FROM action_items WHERE workspace_id = $1 AND owner = $2",
        values: [workspaceId, userId]
    });

    const blocks = res.rows.map(row => markdownSection(row.description));

    const homeViewBlocks = homeView(blocks);

    publishHomeView(userId, workspaceId, client, homeViewBlocks);
};