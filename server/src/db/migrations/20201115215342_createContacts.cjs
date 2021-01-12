/**
 * @typedef {import("knex")} Knex
 */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.createTable("contacts", (table) => {
    table.bigIncrements("id")
    table.string("firstName").notNullable()
    table.string("lastName").notNullable()
    table.string("email").notNullable().unique()
    table.string("zipcode")
    table.boolean("isAVampire").notNullable()
    table.integer("age")
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updatedAt").notNullable().defaultTo(knex.fn.now());
  })
};

/**
 * @param {Knex} knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("contacts")
};
