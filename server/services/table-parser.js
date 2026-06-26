/**
 * 表数据预解析 — 在 sql.js 数据库中执行 DDL+DML，导出结构化表数据
 */
const initSqlJs = require('sql.js');

/** @type {import('sql.js').SqlJsStatic} */
let _SQL = null;

async function getSql() {
  if (!_SQL) _SQL = await initSqlJs();
  return _SQL;
}

/**
 * 在临时 sql.js 数据库中执行 DDL + DML，提取每张表的列名和行数据
 * @param {string} ddl — CREATE TABLE 语句
 * @param {string} dml — INSERT INTO 语句
 * @returns {Promise<Array<{ name: string, columns: string[], rows: Object[] }>>}
 */
async function extractTables(ddl, dml) {
  const SQL = await getSql();
  const db = new SQL.Database();

  try {
    executeStatements(db, ddl);
    executeStatements(db, dml);

    const tableList = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    if (!tableList.length) return [];

    const tableNames = tableList[0].values.map(r => r[0]);
    const tables = [];

    for (const name of tableNames) {
      const result = db.exec(`SELECT * FROM "${name}"`);
      if (!result.length) {
        const colInfo = db.exec(`PRAGMA table_info("${name}")`);
        const columns = colInfo.length ? colInfo[0].values.map(r => r[1]) : [];
        tables.push({ name, columns, rows: [] });
        continue;
      }

      const { columns, values } = result[0];
      const rows = values.map(row => {
        const obj = {};
        columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });

      tables.push({ name, columns, rows });
    }

    return tables;
  } finally {
    db.close();
  }
}

function executeStatements(db, sqlText) {
  if (!sqlText || !sqlText.trim()) return;
  const statements = sqlText
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  for (const stmt of statements) {
    try {
      db.run(stmt);
    } catch (runErr) {
      console.warn('[table-parser] 单条语句执行跳过:', runErr.message.slice(0, 80));
    }
  }
}

/**
 * 在临时 sql.js 数据库中执行 DDL + DML + 一条查询 SQL，返回结果行
 * @param {string} ddl
 * @param {string} dml
 * @param {string} sql — 查询语句
 * @returns {Promise<{ columns: string[], rows: Object[] }>}
 */
async function executeQuery(ddl, dml, sql) {
  const SQL = await getSql();
  const db = new SQL.Database();

  try {
    executeStatements(db, ddl);
    executeStatements(db, dml);

    const stmt = db.prepare(sql.trim());
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { columns, rows };
  } finally {
    db.close();
  }
}

module.exports = { extractTables, executeQuery };
