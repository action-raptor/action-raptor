import {AppDependencies} from "./app";
import {Reader} from "fp-ts/lib/Reader";

function fetchBotTokenForWorkspace(workspaceId: string): Reader<AppDependencies, Promise<string>> {
    return new Reader<AppDependencies, Promise<string>>(({pool}) =>
        pool.query({
            text: "SELECT * FROM slack_tokens WHERE workspace_id = $1",
            values: [workspaceId]
        })
            .then(res => {
                return res.rows[0]?.value;
            })
    );
}

export const arSlackTokens = {
    workspace: (workspaceId: string) => ({
        bot: {
            get: fetchBotTokenForWorkspace(workspaceId),
        },
    }),
};
