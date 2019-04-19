# mysql
note

## 教程
http://www.runoob.com/mysql/mysql-tutorial.html

## 登录
```bash
mysql -u $username -p
```

## 退出
```bash
exit
```

## 列表所有库
```sql
show database
```

## 切换库
```sql
use $tableName
```

## 列出所有表
```sql
show tables
```

## 创建库
```sql
create database $databaseName
```

## 删除库
```sql
drop database $databaseName
```

## 创建表
```sql
create table $tableName (
  `id` int not null auto_increment,
  `name` varchar(100),
  primary key (`id`)
)

create table if not exists $tableName (...)
```

## 新增数据
```sql
insert into $tableName values($value, ...)
insert into $tableName ($filed, ...) values($value, ...)
```