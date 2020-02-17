/* eslint-disable camelcase */

exports.up = (pgm) => {

    pgm.createTable('action_item', {
        id: 'id',
        description: { type: 'varchar(1000)', notNull: true },
        channel_id: { type: 'varchar(1000)', notNull: true },
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

};