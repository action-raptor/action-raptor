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
    pgm.createTable("slack_tokens", {
        id: "id",
        created_at: autoUpdatingTimestamp(pgm),
        last_updated: autoUpdatingTimestamp(pgm),
        workspace_id: {type: "varchar(1000)", notNull: true},
        value: {type: "varchar(1000)", notNull: true},
    }, {
        constraints: {
            unique: ['workspace_id']
        }
    });
    pgm.createIndex("slack_tokens", "workspace_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropIndex("slack_tokens", "workspace_id");
    pgm.dropTable("slack_tokens");
}
