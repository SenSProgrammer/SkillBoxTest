/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema.createTable("notes", (table) =>{
    table.increments("id");
    table.integer('user_id');
    table.string("description");
    table.string("content");
    table.boolean("is_active");
    table.bigInteger("start");





  });
}

  exports.down = function (knex) {
    return knex.schema.dropTable("notes");
  }

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

