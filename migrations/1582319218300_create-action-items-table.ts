/* eslint-disable @typescript-eslint/camelcase */
// tslint:disable-next-line:no-implicit-dependencies
import {MigrationBuilder} from "node-pg-migrate";

export const shorthands = undefined;

const autoUpdatingTimestamp = (pgm: MigrationBuilder) => ({
    type: "timestamp",
    notNull: true,
    default: pgm.func("current_timestamp")
});

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable("action_items", {
        id: "id",
        created_at: autoUpdatingTimestamp(pgm),
        last_updated: autoUpdatingTimestamp(pgm),
        workspace_id: {type: "varchar(1000)", notNull: true},
        channel_id: {type: "varchar(1000)", notNull: true},
        description: {type: "varchar(1000)", notNull: true},
    });
    pgm.createIndex("action_items", ["workspace_id", "channel_id"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropIndex("action_items", ["workspace_id", "channel_id"]);
    pgm.dropTable("action_items");
}
