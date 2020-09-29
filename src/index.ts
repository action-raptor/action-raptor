import {Pool} from "pg";
import {Agent} from "https";
import * as rp from "request-promise";

import {dbOptions} from "./config";
import {buildApp} from "./app";

const port = process.env.PORT || 5000;

const agent = new Agent({keepAlive: true});
const rpApi = rp.defaults({agent});

const pool = new Pool(dbOptions);

(async () => {
    const app = await buildApp({pool, rp: rpApi});
    await app.start(port);

    console.log(`⚡️ Bolt app is running on port ${port}!`);
})();
