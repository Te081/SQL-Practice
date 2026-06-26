/**
 * SQL 校验与模拟执行引擎
 *
 * 使用 node-sql-parser 进行语法校验
 * 使用 sql.js 内存数据库进行模拟执行和结果比对
 */
const { Parser } = require('node-sql-parser');
const initSqlJs = require('sql.js');

const parser = new Parser();

/** @type {import('sql.js').SqlJsStatic} */
let SQL = null;

// 确保 sql.js 初始化（单次）
async function ensureSql() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

/**
 * 校验 SQL 语法有效性
 * @param {string} sql — 用户 SQL 语句
 * @returns {{ valid: boolean, error?: string }}
 */
function validateSyntax(sql) {
  if (!sql || !sql.trim()) {
    return { valid: false, error: 'SQL 语句不能为空' };
  }

  try {
    parser.parse(sql.trim());
    return { valid: true };
  } catch (err) {
    return { valid: false, error: `SQL 语法错误: ${err.message}` };
  }
}

/**
 * 在内存数据库中模拟执行 SQL 并比对结果
 * @param {object} opts
 * @param {string} opts.tableSchema  — DDL 建表语句 (CREATE TABLE ...)
 * @param {string} opts.tableData    — DML 测试数据 (INSERT INTO ...)
 * @param {string} opts.userSql      — 用户提交的查询 SQL
 * @param {string} opts.expectedSql  — 预期正确 SQL
 * @returns {Promise<{ valid: boolean, error?: string, userResult?: Array, expectedResult?: Array, isCorrect?: boolean }>}
 */
async function executeAndCompare({ tableSchema, tableData, userSql, expectedSql }) {
  // 先校验用户 SQL 语法
  const syntaxCheck = validateSyntax(userSql);
  if (!syntaxCheck.valid) {
    return { valid: false, error: syntaxCheck.error };
  }

  await ensureSql();
  const memDb = new SQL.Database();

  try {
    // 1. 执行建表语句
    executeStatements(memDb, tableSchema);

    // 2. 执行插入测试数据
    executeStatements(memDb, tableData);

    // 3. 执行用户 SQL
    let userResult;
    try {
      userResult = queryAll(memDb, userSql.trim());
    } catch (err) {
      return { valid: false, error: `SQL 执行错误: ${err.message}` };
    }

    // 4. 执行预期 SQL（参考答案）
    let expectedResult;
    try {
      expectedResult = queryAll(memDb, expectedSql.trim());
    } catch (err) {
      expectedResult = [];
    }

    // 5. 比对结果
    const isCorrect = compareResults(userResult, expectedResult);

    return {
      valid: true,
      userResult,
      expectedResult,
      isCorrect,
    };
  } catch (err) {
    return { valid: false, error: `执行错误: ${err.message}` };
  } finally {
    memDb.close();
  }
}

/**
 * 分条执行 SQL 语句（以分号分隔 — DDL/DML）
 */
function executeStatements(db, sqlText) {
  if (!sqlText || !sqlText.trim()) return;

  const statements = sqlText
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    db.run(stmt);
  }
}

/**
 * 在 sql.js Database 上执行查询，返回行对象数组
 */
function queryAll(db, sql) {
  const stmt = db.prepare(sql);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * 比对两个查询结果集
 */
function compareResults(resultA, resultB) {
  if (!Array.isArray(resultA) || !Array.isArray(resultB)) return false;
  if (resultA.length !== resultB.length) return false;
  if (resultA.length === 0 && resultB.length === 0) return true;

  const colsA = Object.keys(resultA[0]).sort();
  const colsB = Object.keys(resultB[0]).sort();

  if (colsA.length !== colsB.length) return false;
  if (!colsA.every((col, i) => col === colsB[i])) return false;

  const normalizeRow = (row) => {
    const sorted = {};
    for (const key of Object.keys(row).sort()) {
      sorted[key] = row[key];
    }
    return JSON.stringify(sorted);
  };

  const setA = new Set(resultA.map(normalizeRow));
  const setB = new Set(resultB.map(normalizeRow));

  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

module.exports = {
  validateSyntax,
  executeAndCompare,
  compareResults,
};
