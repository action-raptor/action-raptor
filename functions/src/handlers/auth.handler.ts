import * as express from "express";
import * as rp from "request-promise";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const oauthRedirectHandler = (firestore: admin.firestore.Firestore) => {
    return (request: express.Request, response: express.Response) => {
        console.log(`handling oauth redirect`);

        rp.post(`https://slack.com/api/oauth.v2.access`, {
            form: {
                code: request.query.code,
                client_id: functions.config().slack.client_id,
                client_secret: functions.config().slack.client_secret
            },
            json: true
        }).then((resp) => {
            return firestore.collection(`bot_token`).doc(resp.team.id).set({
                value: resp.access_token
            });
        }).then(() => {
            console.log(`saved access token`);
            response.send("you did it!");
        }).catch((err) => {
            console.log(`error fetching access token: ${err}`);
            response.send("something went wrong");
        });
    }
};
