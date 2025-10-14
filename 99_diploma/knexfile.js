require("dotenv").config();

module.exports = {
  client: 'mysql',
  // version: '7.2',
   connection: {

    // port: 3306
     host : process.env.DB_HOST,
     user : process.env.DB_USER,
     password : process.env.DB_PASSWORD,
     database : process.env.DB_NAME

   },
   migrations:{
     tableName:"knex_migrations",
   },

}

