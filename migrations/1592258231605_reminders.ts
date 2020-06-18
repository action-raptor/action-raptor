/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

const autoUpdatingTimestamp = (pgm: MigrationBuilder) => ({
    type: "timestamp",
    notNull: true,
    default: pgm.func("current_timestamp")
});

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable("reminders", {
        id: "id",
        created_at: autoUpdatingTimestamp(pgm),
        last_updated: autoUpdatingTimestamp(pgm),
        workspace_id: {type: "varchar(1000)", notNull: true},
        channel_id: {type: "varchar(1000)", notNull: true},
        cron: {type: "varchar(100)", notNull: true}
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable("reminders");
}