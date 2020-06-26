import {Client} from "pg";
import {getActionItemsPublic} from "./menu";
import {postToChannel} from "./slack_api";
import * as schedule from "node-schedule";


export const setupReminders = (client: Client) => {
    client.query("select * from reminders")
        .then(stuff => {
            stuff.rows.forEach(row => {
                scheduleReminder(row.workspace_id, row.channel_id, row.cron, client);
                console.log(`set a reminder: ${JSON.stringify(row)}`);
            });
        })
        .catch(err => {
            console.error(`error setting up reminders: ${err}`);
        });
};

const scheduleReminder = (workspaceId: string, channelId: string, cron: string, client: Client) => {
    const job = schedule.scheduleJob(cron, () => {
        remindInChannel(workspaceId, channelId, client)
    });

    console.log(`scheduled job ${job.name} to run at ${job.nextInvocation()}`)
};

const remindInChannel = (workspaceId: string, channelId: string, client: Client) => {
    getActionItemsPublic(workspaceId, channelId, client)
        .then(blocks => {
            return postToChannel(workspaceId, channelId, blocks, client);
        })
        .then(resp => {
            console.log(`got a response from slack: ${JSON.stringify(resp)}`);
        })
        .catch(err => {
            console.log(`error: ${err}`)
        });

    console.log(`scheduled job running for workspace ${workspaceId}, channel ${channelId}`);
};