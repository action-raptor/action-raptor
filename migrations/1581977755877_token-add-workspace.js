/* eslint-disable camelcase */

exports.up = pgm => {

    pgm.addColumns('token', {
        workspace: { type: 'text', notNull: true },
    });

    pgm.createIndex('token', 'workspace');

};

