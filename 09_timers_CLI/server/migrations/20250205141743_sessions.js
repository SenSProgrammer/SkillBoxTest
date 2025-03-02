/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema.createTable("sessions", (table) =>{
    table.increments("id");
    table.integer('user_id');
    table.string("session_id");

  });
}

  exports.down = function (knex) {
    return knex.schema.dropTable("sessions");
  }



/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

