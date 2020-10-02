import * as express from "express";
import {RequestPromiseAPI} from "request-promise";
import {Pool} from "pg";

import {ReaderTaskEither} from "fp-ts/lib/ReaderTaskEither";
import {tryCatch} from "fp-ts/lib/TaskEither";

import {clientId, clientSecret} from "../config";
import {arSlackTokens} from "../slack_bot_tokens";

export type OAuthRedirectDependencies = {
    pool: Pool
    rp: RequestPromiseAPI
}

export type OAuthRedirectError =
    | { _type: "RetrieveAuthTokenFromSlackError", message: string }
    | { _type: "SaveBotTokenError", message: string }
    ;

export const oauthRedirectHandler = (dependencies: OAuthRedirectDependencies) =>
    (request: express.Request, response: express.Response) => {
        console.log(`handling oauth redirect`);

        retrieveAuthTokenFromSlack(request.query.code?.toString() ?? "")
            .chain((resp) => upsertAuthTokenIntoPsql(resp.team.id, "", resp.bot_user_id, resp.access_token))
            .run(dependencies)
            .then(() => {
                console.log(`saved access token`);
                response.send("success!");
            })
            .catch((err) => {
                console.log(`error saving access token: ${err}`);
                response.send("something went wrong");
            });
    };

const retrieveAuthTokenFromSlack = (code: string) => new ReaderTaskEither<OAuthRedirectDependencies, OAuthRedirectError, any>(({rp}) =>
    tryCatch(
        // @ts-ignore
        () => rp.post(`https://slack.com/api/oauth.v2.access`, {
            form: {
                code: code,
                client_id: clientId,
                client_secret: clientSecret
            },
            json: true
        }),
        (err: any) => ({_type: "RetrieveAuthTokenFromSlackError", message: err.toString()})
    ));

const upsertAuthTokenIntoPsql = (workspaceId: string, botId: string, botUserId: string, accessToken: string) => new ReaderTaskEither<OAuthRedirectDependencies, OAuthRedirectError, void>((dependencies) => {
    return tryCatch<OAuthRedirectError, void>(
        () => arSlackTokens
            .workspace(workspaceId)
            .bot
            .save(botId, botUserId, accessToken)
            .run(dependencies),
        (err: any) => ({_type: "SaveBotTokenError", message: err.toString()})
    )
        .map(() => ({}) as unknown as void);
});
