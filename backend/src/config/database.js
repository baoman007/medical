require('dotenv').config();
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// 创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medical_ai',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// 测试数据库连接
pool.getConnection()
  .then(connection => {
    logger.info('数据库连接成功');
    connection.release();
  })
  .catch(err => {
    logger.error('数据库连接失败:', err.message);
    process.exit(1);
  });

// 查询封装
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('数据库查询错误:', error);
    throw error;
  }
};

// 插入并返回ID
const insert = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return result.insertId;
  } catch (error) {
    logger.error('数据库插入错误:', error);
    throw error;
  }
};

// 更新
const update = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    logger.error('数据库更新错误:', error);
    throw error;
  }
};

// 删除
const remove = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    logger.error('数据库删除错误:', error);
    throw error;
  }
};

// 事务支持
const transaction = async (callback) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('事务执行失败:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// 获取连接池状态
const getPoolStatus = () => {
  try {
    return {
      totalConnections: pool.pool?.allConnections?.length || 0,
      activeConnections: (pool.pool?._allConnections?.length || 0) - (pool.pool?._freeConnections?.length || 0),
      freeConnections: pool.pool?._freeConnections?.length || 0
    };
  } catch (error) {
    return {
      totalConnections: 0,
      activeConnections: 0,
      freeConnections: 0
    };
  }
};

module.exports = {
  pool,
  query,
  insert,
  update,
  remove,
  transaction,
  getPoolStatus
};
