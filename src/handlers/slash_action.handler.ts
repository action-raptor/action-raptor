import {Middleware, SlackCommandMiddlewareArgs} from "@slack/bolt";
import {Block} from "@slack/types";

import {Reader} from "fp-ts/lib/Reader";

import {markdownSection} from "../view";
import {getActionItemMenu} from "../menu";
import {AppDependencies} from "../app";

export const actionCommandHandler: Reader<AppDependencies, Middleware<SlackCommandMiddlewareArgs>> =
    new Reader<AppDependencies, Middleware<SlackCommandMiddlewareArgs>>((dependencies: AppDependencies) =>
        async ({command, ack, say, respond}) => {
            await ack();

            const workspaceId = command.team_id;
            const channelId = command.channel_id;

            const blocks: Block[] = await getActionItemMenu(workspaceId, channelId, dependencies.pool)
                .catch((err: any) => {
                    console.error(`error fetching items: ${err}`);

                    return [
                        markdownSection(`something went wrong. please try again`),
                    ];
                });

            return respond({
                response_type: "ephemeral",
                blocks: blocks,
            });
        });
