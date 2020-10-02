import {AppDependencies} from "./app";
import {Reader} from "fp-ts/lib/Reader";

export type SlackTokenEntity = {
    id: number,
    created_at: Date,
    last_updated: Date,
    workspace_id: string
    bot_id: string
    bot_user_id: string
    value: string
};

function listBotTokens(): Reader<AppDependencies, Promise<SlackTokenEntity[]>> {
    return new Reader<AppDependencies, Promise<SlackTokenEntity[]>>(({pool}) =>
        pool.query({text: "SELECT * FROM slack_tokens"})
            .then(res => res.rows)
    );
}

function fetchBotTokenForWorkspace(workspaceId: string): Reader<AppDependencies, Promise<SlackTokenEntity>> {
    return new Reader<AppDependencies, Promise<SlackTokenEntity>>(({pool}) =>
        pool.query({
            text: "SELECT * FROM slack_tokens WHERE workspace_id = $1",
            values: [workspaceId]
        })
            .then(res => res.rows[0])
    );
}

function saveBotTokenForWorkspace(workspaceId: string, botId: string, botUserId: string, token: string): Reader<AppDependencies, Promise<void>> {
    return new Reader<AppDependencies, Promise<void>>(async ({pool}) => {
            await pool.query({
                text: `
INSERT INTO slack_tokens(workspace_id, bot_id, bot_user_id, value) 
  VALUES ($1, $2, $3, $4) 
ON CONFLICT (workspace_id) DO UPDATE SET 
  bot_id=EXCLUDED.bot_id,
  bot_user_id=EXCLUDED.bot_user_id,
  value=EXCLUDED.value
`,
                values: [workspaceId, botId, botUserId, token],
            });
        }
    );
}

export const arSlackTokens = {
    workspace: (workspaceId: string) => ({
        bot: {
            get: fetchBotTokenForWorkspace(workspaceId),
            save: (botId: string, botUserId: string, token: string) => saveBotTokenForWorkspace(workspaceId, botId, botUserId, token),
        },
    }),
    list: listBotTokens(),
};
