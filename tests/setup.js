global.cloud = {
  database: () => ({
    collection: () => ({
      where: () => ({
        get: jest.fn().mockResolvedValue({ data: [] }),
        count: jest.fn().mockResolvedValue({ total: 0 }),
        orderBy: () => ({
          skip: () => ({
            limit: () => ({
              get: jest.fn().mockResolvedValue({ data: [] })
            })
          })
        }),
        update: jest.fn().mockResolvedValue({ stats: { updated: 1 } }),
        add: jest.fn().mockResolvedValue({ id: 'test-id' }),
        doc: () => ({
          get: jest.fn().mockResolvedValue({ data: null }),
          update: jest.fn().mockResolvedValue({ stats: { updated: 1 } }),
          remove: jest.fn().mockResolvedValue({ success: true })
        })
      })
    })
  })
}

global.db = {
  command: {
    eq: (val) => ({ type: 'eq', value: val }),
    gt: (val) => ({ type: 'gt', value: val }),
    gte: (val) => ({ type: 'gte', value: val }),
    lt: (val) => ({ type: 'lt', value: val }),
    lte: (val) => ({ type: 'lte', value: val }),
    in: (arr) => ({ type: 'in', value: arr }),
    and: (...conds) => ({ type: 'and', conditions: conds }),
    or: (...conds) => ({ type: 'or', conditions: conds }),
    set: (val) => ({ type: 'set', value: val }),
    inc: (val) => ({ type: 'inc', value: val }),
    mul: (val) => ({ type: 'mul', value: val }),
    pull: (val) => ({ type: 'pull', value: val }),
    push: (...vals) => ({ type: 'push', values: vals })
  }
}

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
}))
