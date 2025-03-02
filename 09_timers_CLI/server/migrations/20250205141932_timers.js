/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema.createTable("timers", (table) =>{
    table.increments("id");
    table.integer('user_id');
    table.string("description");
    table.bigInteger('duration');
    table.boolean("is_active");
    table.bigInteger("start");
    table.bigInteger("end");




  });
}

  exports.down = function (knex) {
    return knex.schema.dropTable("timers");
  }

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

