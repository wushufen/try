var mysql = require('mysql')
var mysqlPoll = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'test'
})

let startDate = new Date
let times = 5000
console.log('startDate')
for (let i = 0; i < times; i++) {
  mysqlPoll.getConnection(function (error, connection) {
    var sql = 'select * from user'
    connection.query(sql, function (error, results, fields) {
      if(i == times - 1){
        if(!error){
          let endDate = new Date
          console.log((endDate - startDate) / 1000)
        }
      }
      connection.release()
    })
  })
}
