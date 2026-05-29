import Dexie from 'dexie'

export const db = new Dexie('PromptForgeDB')

// 使用字符串 id（非自增），兼容现有 UUID
db.version(1).stores({
  history: 'id, name, content, modeId, createdAt',
  config: 'key',
  kv: 'key'
})

export default db
