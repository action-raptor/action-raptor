import {Pool} from "pg";
import * as express from "express";
import * as moment from "moment";
import {publishHomeView} from "../slack_api";
import {homeView} from "../view";

export const eventHandler = (pool: Pool) => {
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

        updateHomeTab(userId, workspaceId, pool)
            .catch(err => {
                console.log(`an error occurred handling events: ${err}`);
            });
    };
};

const updateHomeTab = async (userId: string, workspaceId: string, pool: Pool) => {
    const result = await pool.query({
        text: "SELECT * FROM action_items WHERE workspace_id = $1 AND owner = $2",
        values: [workspaceId, userId]
    });

    const completedItems = result.rows.filter(row => row.status === 'COMPLETED');

    const avgMs = completedItems.length > 0 ?
        completedItems
            .map(row => row.closed_at.getTime() - row.created_at.getTime())
            .reduce((acc, current) => acc + current) / completedItems.length
        : 0;
    const averageTimeString = moment.duration(avgMs).humanize();

    const openItems = result.rows
        .filter(row => row.status === 'OPEN');

    const homeViewBlocks = homeView(averageTimeString, completedItems.length, openItems);

    await publishHomeView(userId, workspaceId, pool, homeViewBlocks);
};