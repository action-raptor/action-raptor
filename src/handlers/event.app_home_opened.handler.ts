import {Middleware, SlackEventMiddlewareArgs} from "@slack/bolt";
import {Block} from "@slack/types";
import * as moment from "moment";

import {record} from "fp-ts";
import {fromFoldableMap} from "fp-ts/lib/Record";
import {array, getMonoid} from "fp-ts/lib/Array";
import {Reader} from "fp-ts/lib/Reader";

import {divider, markdownSection} from "../view";
import {AppDependencies} from "../app";
import {ActionItem, isCompleted, isOpen, OpenActionItem} from "../model.action_item";

export const appHomeOpenedHandler: Reader<AppDependencies, Middleware<SlackEventMiddlewareArgs<"app_home_opened">>> =
    new Reader((dependencies) => async ({body, client}) => {
        const userId = body.event.user;
        const workspaceId = body.team_id;
        try {
            const actionItems = await fetchAllActionItemsForUser(userId, workspaceId)(dependencies);

            const averageCompletionTimeMs = calculateAverageCompletionTimeMs(actionItems);

            const completedItems = actionItems.filter(isCompleted);
            const openItems = actionItems.filter(isOpen);

            const homeViewBlocks = homeView(averageCompletionTimeMs, completedItems.length, openItems);

            const viewPublishResult = await client.views.publish({
                user_id: userId,
                view: {
                    type: "home",
                    blocks: homeViewBlocks,
                }
            });

            console.log(`updated home view. ${JSON.stringify({
                workspace_id: workspaceId,
                user_id: userId,
                result: viewPublishResult
            })}`);
        } catch (err) {
            console.error(`unexpected error while updating home view. ${JSON.stringify({
                workspace_id: workspaceId,
                user_id: userId,
                err: err
            })}`);
            console.error(err);
        }
    });

function fetchAllActionItemsForUser(userId: string, workspaceId: string): (dependencies: AppDependencies) => Promise<ActionItem[]> {
    return async ({pool}) => {
        const result = await pool.query({
            text: "SELECT * FROM action_items WHERE workspace_id = $1 AND owner = $2",
            values: [workspaceId, userId]
        });
        return result.rows;
    };
}

function calculateAverageCompletionTimeMs(actionItems: ActionItem[]): number {
    const completedItems = actionItems.filter(isCompleted);

    if (completedItems.length === 0) {
        return 0;
    }

    const totalCompletionTimeMs = completedItems
        .map(item => item.closed_at.getTime() - item.created_at.getTime())
        .reduce((acc, current) => acc + current);
    return totalCompletionTimeMs / completedItems.length;
}

//
// View
//

const formLink = "https://docs.google.com/forms/d/e/1FAIpQLSe1SltHxH47haVZzKe1x6eLsC89WmdEWtOTr_jo1sxg9t-jQw/viewform?usp=sf_link";

const homeView = (avgMs: number, completedCount: number, openItems: OpenActionItem[]): Block[] => {
    return [
        markdownSection(`Insights here are only visible to you. Let us know what you'd like to see on this page <${formLink}|here>`),

        divider(),

        markdownSection(`You've completed *${completedCount}* action items`),
        markdownSection(`On average, you take *${moment.duration(avgMs).humanize()}* to complete action items`),

        divider(),

        markdownSection("Here are your open action items:"),
        ...actionItemsList(openItems)
    ]
};

const reduceToRecord = fromFoldableMap(getMonoid<string>(), array);

const actionItemsList = (items: ActionItem[]) => {
    const channelToDescriptions: Record<string, string[]> = reduceToRecord(items, (item: ActionItem) => [item.channel_id, [item.description]]);

    return record.collect(channelToDescriptions, (channel_id, descriptions) => {
        const itemList = descriptions.map(v => `\n- ${v}`).join("");
        return markdownSection(`<#${channel_id}>${itemList}`);
    });
};
