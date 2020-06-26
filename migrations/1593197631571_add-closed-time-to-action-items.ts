/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.addColumn('action_items', {
        closed_at: { type: 'timestamp' }
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropColumn('action_items', 'closed_at');
}
