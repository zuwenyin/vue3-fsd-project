PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sys_menu (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id              INTEGER REFERENCES sys_menu(id) ON DELETE CASCADE,
  name                   TEXT    NOT NULL UNIQUE,          -- 路由名，Tabs/keep-alive key
  path                   TEXT    NOT NULL,
  redirect               TEXT,
  component              TEXT,                             -- 'Layout' | 'system/user/index' | NULL(目录)
  title                  TEXT    NOT NULL,
  title_key              TEXT,
  icon                   TEXT,
  order_no               REAL    NOT NULL DEFAULT 1000,    -- REAL 支持中间数插入
  keep_alive             INTEGER NOT NULL DEFAULT 1,
  hide_in_menu           INTEGER NOT NULL DEFAULT 0,
  hide_children_in_menu  INTEGER NOT NULL DEFAULT 0,
  active_path            TEXT,
  external               INTEGER NOT NULL DEFAULT 0,
  affix                  INTEGER NOT NULL DEFAULT 0,
  layout                 TEXT    CHECK (layout IN ('sidebar','top','mix','dual')),
  roles                  TEXT    NOT NULL DEFAULT '[]',    -- JSON 数组
  permissions            TEXT    NOT NULL DEFAULT '[]',    -- JSON 数组
  status                 INTEGER NOT NULL DEFAULT 1,       -- 1 启用 0 停用
  publish_status         TEXT    NOT NULL DEFAULT 'published' CHECK (publish_status IN ('draft','published')),
  published_at           TEXT,
  created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_menu_parent ON sys_menu(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_menu_path_parent ON sys_menu(parent_id, path);

CREATE TABLE IF NOT EXISTS sys_user (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,           -- 演示用，生产禁止明文
  nickname    TEXT NOT NULL,
  avatar      TEXT,
  roles       TEXT NOT NULL DEFAULT '[]',
  permissions TEXT NOT NULL DEFAULT '[]',
  status      INTEGER NOT NULL DEFAULT 1
);
