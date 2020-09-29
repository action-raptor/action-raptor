import * as express from "express";
import {RequestPromiseAPI} from "request-promise";
import {Pool} from "pg";

import {ReaderTaskEither} from "fp-ts/lib/ReaderTaskEither";
import {tryCatch} from "fp-ts/lib/TaskEither";

import {clientId, clientSecret} from "../config";

export type OAuthRedirectDependencies = {
    pool: Pool
    rp: RequestPromiseAPI
}

export type OAuthRedirectError =
    | { _type: "RetrieveAuthTokenFromSlackError", message: string }
    | { _type: "UpsertAuthTokenIntoPsqlError", message: string }
    ;

export const oauthRedirectHandler = (dependencies: OAuthRedirectDependencies) =>
    (request: express.Request, response: express.Response) => {
        console.log(`handling oauth redirect`);

        retrieveAuthTokenFromSlack(request.query.code?.toString() ?? "")
            .chain((resp) => upsertAuthTokenIntoPsql(resp.access_token, resp.team.id))
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

const upsertAuthTokenIntoPsql = (accessToken: string, workspaceId: string) => new ReaderTaskEither<OAuthRedirectDependencies, OAuthRedirectError, void>(({pool}) => {
    const query = `INSERT INTO slack_tokens(value, workspace_id) VALUES ($1, $2) ON CONFLICT (workspace_id) DO UPDATE SET value=EXCLUDED.value`;
    const values = [accessToken, workspaceId];

    return tryCatch<OAuthRedirectError, any>(
        () => pool.query(query, values),
        (err: any) => ({_type: "UpsertAuthTokenIntoPsqlError", message: err.toString()})
    )
        .map(() => ({}) as unknown as void);
});
