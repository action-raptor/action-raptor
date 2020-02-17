
exports.up = (pgm) => {

    pgm.createTable('token', {
        id: 'id',
        value: { type: 'varchar(1000)', notNull: true },
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

};