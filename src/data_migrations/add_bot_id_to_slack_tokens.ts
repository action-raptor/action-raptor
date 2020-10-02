import {Pool} from "pg";
import {WebClient} from "@slack/web-api";
import {RequestPromiseAPI} from "request-promise";
import {arSlackTokens} from "../slack_bot_tokens";

export type MigrationDependencies = {
    pool: Pool
    client: WebClient
    rp: RequestPromiseAPI
};

export async function addBotInfoToBotTokens(dependencies: MigrationDependencies) {
    const tokens = await arSlackTokens.list.run(dependencies);

    for (const token of tokens) {
        const {user_id, bot_id} = await dependencies.client.auth.test({token: token.value});

        await arSlackTokens
            .workspace(token.workspace_id)
            .bot
            .save(`${bot_id}`, `${user_id}`, token.value)
            .run(dependencies)
    }
}

