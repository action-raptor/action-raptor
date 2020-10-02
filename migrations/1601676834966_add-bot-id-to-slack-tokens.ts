/* eslint-disable @typescript-eslint/camelcase */
import {ColumnDefinitions, MigrationBuilder} from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.addColumn("slack_tokens", {
        bot_id: {type: "text"},
        bot_user_id: {type: "text"},
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropColumn("slack_tokens", "bot_id");
    pgm.dropColumn("slack_tokens", "bot_user_id");
}
