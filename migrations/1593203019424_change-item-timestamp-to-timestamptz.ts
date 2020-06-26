/* eslint-disable @typescript-eslint/camelcase */
import {MigrationBuilder, ColumnDefinitions} from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

const autoUpdatingTimestamptz = (pgm: MigrationBuilder) => ({
    type: "timestamptz",
    notNull: true,
    default: pgm.func("current_timestamp")
});

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.alterColumn('action_items', 'created_at', autoUpdatingTimestamptz(pgm));
    pgm.alterColumn('action_items', 'last_updated', autoUpdatingTimestamptz(pgm));
}

const autoUpdatingTimestamp = (pgm: MigrationBuilder) => ({
    type: "timestamp",
    notNull: true,
    default: pgm.func("current_timestamp")
});

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.alterColumn('action_items', 'created_at', autoUpdatingTimestamp(pgm));
    pgm.alterColumn('action_items', 'last_updated', autoUpdatingTimestamp(pgm));
}
