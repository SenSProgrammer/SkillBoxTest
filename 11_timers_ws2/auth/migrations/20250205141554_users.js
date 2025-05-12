/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema.createTable("users", (table) =>{
    table.increments("id");
    table.string('username',255).unique();
    table.string('password',255);

  });
}

  exports.down = function (knex) {
    return knex.schema.dropTable("users");
  }


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
