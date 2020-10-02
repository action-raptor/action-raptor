import {Pool} from "pg";
import * as schedule from "node-schedule";
import {RequestPromiseAPI} from "request-promise";
import {WebClient} from "@slack/web-api";

import {getActionItemsPublic} from "./menu";
import {arSlackTokens} from "./slack_bot_tokens";

export type RemindersDependencies = {
    pool: Pool
    client: WebClient
    rp: RequestPromiseAPI
};

export const setupReminders = async (dependencies: RemindersDependencies) => {
    await dependencies.pool.query("SELECT * FROM reminders")
        .then(reminders =>
            reminders.rows.forEach(row => {
                scheduleReminder(row.workspace_id, row.channel_id, row.cron, dependencies);
            })
        )
        .catch(err => {
            console.error(`error setting up reminders: ${err}`);
        });
};

const scheduleReminder = (workspaceId: string, channelId: string, cron: string, dependencies: RemindersDependencies) => {
    const job = schedule.scheduleJob(cron, () => remindInChannel(workspaceId, channelId, dependencies));

    console.log(`scheduled job ${job.name} to run at ${job.nextInvocation()}`)
};

const remindInChannel = async (workspaceId: string, channelId: string, dependencies: RemindersDependencies) => {
    try {
        const blocks = await getActionItemsPublic(workspaceId, channelId, dependencies);

        await dependencies.client.chat.postMessage({
            token: await arSlackTokens.workspace(workspaceId).bot.get.run(dependencies),
            channel: channelId,
            text: "Here are all open action items",
            blocks: blocks,
        });

        console.log(`posted action items to channel (scheduled). ${JSON.stringify({
            workspace_id: workspaceId,
            channel_id: channelId,
        })}`);
    } catch (err) {
        console.error(`unexpected error while posting action items to channel (scheduled). ${JSON.stringify({
            workspace_id: workspaceId,
            channel_id: channelId,
            err: err.toString(),
        })}`);
        console.error(err);
    }
};
