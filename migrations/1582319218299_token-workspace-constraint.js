/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addConstraint("token", "token_unique_workspace_constraint", {unique: "workspace"});
};

exports.down = pgm => {
    pgm.dropConstraint("token", "token_unique_workspace_constraint", {unique: "workspace"});
};
