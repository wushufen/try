let mysql = require('mysql')
let config = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'test'
}

class DB {
  constructor(){
    Object.assign(this, {
      poll: mysql.createPool(config)
    })
  }
  // list: []
  // get: {}||0
  // save: 
  // error: errorno
  query(sql, args, isOne){
    console.log('====', sql, args, '====')
    return new Promise((resolve, reject)=>{
      this.poll.getConnection((error, connection)=>{
        connection.query(sql, args, (error, result, fields)=>{
          // console.log(result)
          if (!error) {
            result = isOne? result[0]: result
            result = result || 0
            resolve(result)
          } else {
            resolve(error.errno)
          }
        })
      })
    })
  }
  getSqlFields(data){
    return '`' + Object.keys(data).join('`, `') + '`'  // '`id`, `name`'
  }
  getSqlValues(data){
    return Object.values(data).map(value=>'?').join(', ') // '?, ?'
  }
  getSqlWhere(data){
    let fields = Object.keys(data)
    if (fields.length) {
      return  '`' + Object.keys(data).join('`=? and `') + '`=?' // '`id`=?, `name`=?'
    }
    return ''
  }
  createTable(tableName, data){

  }
  save(tableName, data){
    let fields = Object.keys(data)
    let values = Object.values(data)
    let sqlFields = this.getSqlFields(data)
    let sqlValues = this.getSqlValues(data)
    let sqlUpdateSet = fields.map(field=>'`' + field + '`=values(`' + field + '`)').join(', ') // '`id`=values(`id`), `name`=values(`name`)'

    let sql = `insert into ?? (${sqlFields}) values (${sqlValues}) on duplicate key update ${sqlUpdateSet}`
    let args = [tableName].concat(values)

    return this.query(sql, args)
  }
  list(tableName, data={}, options={}, isOne){
    let values = Object.values(data)
    let sqlWhere = this.getSqlWhere(data)

    let sql = `select * from ??`
    if (sqlWhere) {
      sql += ` where ${sqlWhere}`
    }
    if (options.orderBy) {
      sql += ' order by `' + options.orderBy + '`'
    }
    if (options.pageNo) {
      // todo
    }
    let args = [tableName].concat(values)

    return this.query(sql, args, isOne)
  }
  get(tableName, data={}, options={}){
    return this.list(tableName, data, options, true)
  }
  delete(tableName, data={}){
    let values = Object.values(data)
    let sqlWhere = this.getSqlWhere(data)

    let sql = `delete from ??`
    if (sqlWhere) {
      sql += ` where ${sqlWhere}`
    } else {
      throw 'can not delete all'
    }
    let args = [tableName].concat(values)

    return this.query(sql, args)
  }
}

let db = new DB

!(async function(){
  // db.delete('user')
  db.save('user', {id:3, name:'wsf222'})
  let rs = await db.get('userx', {id:1})
  console.log(JSON.stringify(rs, null, ''))
}())
