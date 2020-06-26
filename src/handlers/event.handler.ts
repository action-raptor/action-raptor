import {Client} from "pg";
import * as express from "express";
import {publishHomeView} from "../slack_api";
import {homeView} from "../view";

export const eventHandler = (client: Client) => {
    return (request: express.Request, response: express.Response) => {
        console.log(`handling event: ${JSON.stringify(request.body)}`);

        if (request.body.type === "url_verification") {
            response.status(200).send(request.body.challenge);
            return;
        }

        response.status(200).send();
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

    const completeds = res.rows.filter(row => row.status === 'COMPLETED');
    const avgMs = completeds.length > 0 ?
        completeds
            .map(row => row.closed_at.getTime() - row.created_at.getTime())
            .reduce((acc, current) => acc + current) / completeds.length
        : 0;

    const avgMins = avgMs / 1000 / 60;

    const itemDescriptions = res.rows
        .filter(row => row.status === 'OPEN')
        .map(row => row.description);

    const homeViewBlocks = homeView(avgMins, completeds.length, itemDescriptions);

    publishHomeView(userId, workspaceId, client, homeViewBlocks);
};