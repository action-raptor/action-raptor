import * as express from "express";
import * as rp from "request-promise";
import {Client} from "pg";

import {ReaderTaskEither} from "fp-ts/lib/ReaderTaskEither";
import {tryCatch} from "fp-ts/lib/TaskEither";

import {clientId, clientSecret} from "../config";

export type OAuthRedirectDependencies = {
    client: Client
    rpApi: rp.RequestPromiseAPI
}

export type OAuthRedirectError =
    { _type: "RetrieveAuthTokenFromSlackError", message: string }
    | { _type: "UpsertAuthTokenIntoPsqlError", message: string }
    ;

export const oauthRedirectHandler = (dependencies: OAuthRedirectDependencies) =>
    (request: express.Request, response: express.Response) => {
        console.log(`handling oauth redirect`);

        retrieveAuthTokenFromSlack(request.query.code)
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

const retrieveAuthTokenFromSlack = (code: string) => new ReaderTaskEither<OAuthRedirectDependencies, OAuthRedirectError, any>(({rpApi}) =>
    tryCatch(
        // @ts-ignore
        () => rpApi.post(`https://slack.com/api/oauth.v2.access`, {
            form: {
                code: code,
                client_id: clientId,
                client_secret: clientSecret
            },
            json: true
        }),
        (err: any) => ({_type: "RetrieveAuthTokenFromSlackError", message: err.toString()})
    ));

const upsertAuthTokenIntoPsql = (accessToken: string, teamId: string) => new ReaderTaskEither<OAuthRedirectDependencies, OAuthRedirectError, void>(({client}) => {
    const query = `INSERT INTO token(value, workspace) VALUES ($1, $2)`;
    const values = [accessToken, teamId];

    return tryCatch<OAuthRedirectError, any>(
        () => client.query(query, values),
        (err: any) => ({_type: "UpsertAuthTokenIntoPsqlError", message: err.toString()})
    )
        .map(() => ({}) as unknown as void);
});
