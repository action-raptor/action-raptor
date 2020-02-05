import * as admin from "firebase-admin";
import {Block} from "@slack/types";
import * as rp from "request-promise";

export const postToChannel = (firestore: admin.firestore.Firestore, workspaceId: string, channelId: string, blocks: (Block)[]) => {
    return fetchToken(firestore, workspaceId)
        .then(tokenDoc => {
            console.log(`fetched bot token`);
            const options = {
                method: 'POST',
                uri: `https://slack.com/api/chat.postMessage`,
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${tokenDoc.data()?.value}`
                },
                body: {
                    channel: channelId,
                    blocks: blocks
                },
                json: true
            };

            return rp(options);
        });
};

export const fetchToken = (firestore: admin.firestore.Firestore, workspaceId: string) => {
    return firestore.collection(`bot_token`).doc(workspaceId).get()
        .then((tokenDoc) => {
            return tokenDoc.data()?.value
        });
};