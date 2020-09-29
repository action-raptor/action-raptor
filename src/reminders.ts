import {Pool} from "pg";
import * as schedule from "node-schedule";
import {getActionItemsPublic} from "./menu";
import {postToChannel} from "./slack_api";

export const setupReminders = async (pool: Pool) => {
    await pool.query("select * from reminders")
        .then(stuff => {
            stuff.rows.forEach(row => {
                scheduleReminder(row.workspace_id, row.channel_id, row.cron, pool);
                console.log(`set a reminder: ${JSON.stringify(row)}`);
            });
        })
        .catch(err => {
            console.error(`error setting up reminders: ${err}`);
        });
};

const scheduleReminder = (workspaceId: string, channelId: string, cron: string, pool: Pool) => {
    const job = schedule.scheduleJob(cron, () => {
        remindInChannel(workspaceId, channelId, pool)
    });

    console.log(`scheduled job ${job.name} to run at ${job.nextInvocation()}`)
};

const remindInChannel = (workspaceId: string, channelId: string, pool: Pool) => {
    getActionItemsPublic(workspaceId, channelId, pool)
        .then(blocks => {
            return postToChannel(workspaceId, channelId, blocks, pool);
        })
        .then(resp => {
            console.log(`got a response from slack: ${JSON.stringify(resp)}`);
        })
        .catch(err => {
            console.log(`error: ${err}`)
        });

    console.log(`scheduled job running for workspace ${workspaceId}, channel ${channelId}`);
};
