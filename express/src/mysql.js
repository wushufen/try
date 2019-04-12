var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'test'
});

connection.connect();


var sql = 'select * from user'
connection.query(sql, function (error, results, fields) {
  console.log(results);
});