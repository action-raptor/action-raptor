import * as fs from 'fs';

export const clientId = process.env.SLACK_CLIENT_ID || getLocalCreds().slack_client_id;
export const clientSecret = process.env.SLACK_CLIENT_SECRET || getLocalCreds().slack_client_secret;

function getLocalCreds() {
    const localCredsFile = fs.readFileSync('.credentials','utf8');
    return JSON.parse(localCredsFile);
}