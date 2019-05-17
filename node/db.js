let mysql = require('mysql')
let config = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'test',
  multipleStatements: true,
}

class DB {
  constructor(){
    Object.assign(this, {
      poll: mysql.createPool(config),
    })
  }
  // list: []
  // get: {}||0
  // save:
  // error: errorno
  query(sql, args){
    return new Promise((resolve, reject)=>{
      this.poll.getConnection((error, connection)=>{
        if (error) {
          resolve({
            error
          })
        }

        let query = connection.query(sql, args, (error, result, fields)=>{
          console.log('sql: ', query.sql)
          console.log('result:', result, '\n')

          resolve({
            error,
            result,
            fields,
          })
        })
      })
    })
  }
  /**
   * @param {Object} data
   * @returns {Object}
   *  sql: ' where ? and ?'
   *  values: [
   *    {k1: v1},
   *    {k2: v2},
   *  ]
   */
  getWhere(data){
    let pls = []
    let kvs = []
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key]
        let kv = {}
        kv[key] = value
        pls.push('?')
        kvs.push(kv)
      }
    }
    return {
      sql: pls.length ? ' where ' + pls.join(' and ') : '',
      values: kvs // [{k:v}, {k2:v2}]
    }
  }
  createTable(tableName, data = {}){
    let sql = 'create table if not exists ?? '
    let args = [tableName]

    sql += '('
    sql += '`id` int auto_increment not null primary key'
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (key != 'id') {
          sql += ', ?? text'
          args.push(key)
        }
      }
    }
    sql += ')'

    return this.query(sql, args)
  }
  addColumns(tableName, data) {
    // `
    // select column_name
    // from information_schema.columns
    // where table_schema=database()
    // and table_name='user'
    // and column_name='xid'
    // `
    let all = []
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        let sql = 'alter table ?? add column ?? text'
        let args = [tableName, key]
        let promise = new Promise(resolve=>{
          this.query(sql, args).finally(()=>{
            resolve()
          })
        })
        all.push(promise)
      }
    }
    return Promise.all(all)
  }
  async save(tableName, data){
    let sql = 'insert into ?? set ? on duplicate key update ?'
    let args = [tableName, data, data]

    let rs = await this.query(sql, args)
    if (rs.error) {
      if (rs == 1146) {
        await this.createTable(tableName, data)
        return this.query(sql, args)
      }
      if (rs == 1054) {
        await this.addColumns(tableName, data)
        return this.query(sql, args)
      }
    }

    return rs
  }
  list(tableName, data = {}, options = {pageNo: 1, pageSize: 1000}){
    let sql = 'select count(*) as total from ??; select * from ??'
    let args = [tableName, tableName]

    let where = this.getWhere(data)
    sql += where.sql
    args.push(...where.values)

    if (options.pageNo) {
      sql += ' limit ?,?'
      let pageSize = options.pageSize || 10
      let index = (options.pageNo - 1) * pageSize
      args.push(index, pageSize)
    }

    return this.query(sql, args)
  }
  get(tableName, data = {}, options = {}){
    let sql = 'select * from ??'
    let args = [tableName]

    let where = this.getWhere(data)
    sql += where.sql
    args.push(...where.values)

    return this.query(sql, args, true)
  }
  delete(tableName, data = {}){
    let sql = 'delete from ??'
    let args = [tableName]

    let where = this.getWhere(data)
    sql += where.sql
    args.push(...where.values)

    if (!where.sql) {
      throw 'delete without where !!!'
    }

    return this.query(sql, args)
  }
}

let db = new DB

!(async function(){
  // var rs = await db.query('drop table ??', ['test'])
  // var rs = await db.query('create table if not exists ?? (?? int auto_increment not null primary key, ?? text)', ['test', 'id', 'name'])
  // var rs = await db.query('alter table ?? add column ?? text', ['test', 'age'])
  // var rs = await db.query('insert into ?? (??, ??, ??) values(?, ?, ?) on duplicate key update ??=?, ??=?, ??=?', ['test', 'id', 'name', 'age', 1, 'wsf', 333, 'id', 1, 'name', 'wsf', 'age', 333])
  // var rs = await db.query('insert into ?? set ? on duplicate key update ?', ['test', {id:2, name:2}, {id:2, name:22}])
  // var rs = await db.query('select * from ?? where ??=? and ??=?', ['test', 'id', 1, 'name', 222])
  // var rs = await db.query('delete from ?? where ??=? and ??=?', ['test', 'id', 1, 'name', 222])
  // var rs = await db.query('select * from test where id=1; select count(*) as total from test; ')

  // var rs = await db.createTable('test', {id:1, name: 'wsf'})
  // var rs = await db.addColumns('test', {age: 18})

  // var rs = await db.save('test', {id: 1, name: '`~!@#$%^&*()_+-=//\\"\'--wsf3;', age: 1})
  // var rs = await db.save('test', {name: 'wsf', age: 1})
  // var rs = await db.save('test', {name: 'wsf', age: 1})

  // var rs = await db.list('test')
  // var rs = await db.list('test', {name: 'wsf', age: 1})
  var rs = await db.list('test', {}, {pageNo: 1, pageSize: 2})

  // var rs = await db.get('test', {id:2, name: 22})

  // var rs = await db.delete('test')

  // var rs = await db.getWhere({id: 1, name: 2})

  // console.log(JSON.stringify(rs, null, ''))
  console.log(rs)
}())
