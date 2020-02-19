import * as express from "express";
import * as rp from "request-promise";
import {Client} from "pg";
import {clientId, clientSecret} from "../config";

export const oauthRedirectHandler = (client: Client) => {
    return (request: express.Request, response: express.Response) => {
        console.log(`handling oauth redirect`);

        rp.post(`https://slack.com/api/oauth.v2.access`, {
            form: {
                code: request.query.code,
                client_id: clientId,
                client_secret: clientSecret
            },
            json: true
        }).then((resp) => {
            const query = `INSERT INTO token(value, workspace) VALUES ($1, $2)`;
            const values = [resp.access_token, resp.team.id];
            return client.query(query, values);
        }).then(() => {
            console.log(`saved access token`);
            response.send("success!");
        }).catch((err) => {
            console.log(`error saving access token: ${err}`);
            response.send("something went wrong");
        });
    }
};
