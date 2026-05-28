const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const MAIN_DORMS = [
  '中园公寓', '中南公寓', '新柏居', '苏园居', '知行1栋', '敏学1栋',
  '松柏居', '三友园', '四季园', '清水居', '新松居', '洪山园1栋'
]

const DEFAULT_DORMS = MAIN_DORMS.slice(0, 8)

function getLevel(count, maxCount) {
  if (!count || !maxCount) return 'cold'
  const ratio = count / maxCount
  if (ratio >= 0.75) return 'hot'
  if (ratio >= 0.5) return 'warm'
  if (ratio >= 0.25) return 'normal'
  return 'cold'
}

function getDemoDormHeat() {
  const raw = [
    { dorm: '中园公寓', count: 86 },
    { dorm: '苏园居', count: 72 },
    { dorm: '中南公寓', count: 65 },
    { dorm: '知行1栋', count: 58 },
    { dorm: '新柏居', count: 51 },
    { dorm: '三友园', count: 47 },
    { dorm: '敏学1栋', count: 43 },
    { dorm: '松柏居', count: 38 }
  ]
  const maxCount = raw[0].count
  return raw.map((item) => ({
    ...item,
    level: getLevel(item.count, maxCount),
    percent: Math.round((item.count / maxCount) * 100)
  }))
}
const PAGE_SIZE = 100
const MAX_RECORDS = 1000
const TIME_WINDOWS = [24, 24 * 7, 24 * 30, null]

async function fetchCollection(collectionName) {
  const all = []
  let skip = 0

  while (all.length < MAX_RECORDS) {
    const res = await db.collection(collectionName)
      .skip(skip)
      .limit(PAGE_SIZE)
      .get()

    all.push(...res.data)
    if (res.data.length < PAGE_SIZE) break
    skip += PAGE_SIZE
  }

  return all
}

function getTimestamp(value) {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && value.$date) return new Date(value.$date).getTime()
  const num = Number(value)
  if (!Number.isNaN(num) && num > 0) return num
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function getOrderTime(order) {
  return getTimestamp(
    order.create_time ||
    order.created_at ||
    order.createdAt ||
    order.updatedAt ||
    order.updated_at
  )
}

function getBoxTime(box) {
  return getTimestamp(box.publish_time || box.create_time || box.createdAt)
}

function normalizeDorm(name) {
  if (!name || typeof name !== 'string') return null
  const trimmed = name.trim()
  if (!trimmed) return null
  return trimmed
}

function addCount(counts, dorm, weight = 1) {
  if (!dorm || weight <= 0) return
  counts[dorm] = (counts[dorm] || 0) + weight
}

async function buildBoxMap(boxIds) {
  const map = {}
  const uniqueIds = [...new Set(boxIds.filter(Boolean))]

  for (let i = 0; i < uniqueIds.length; i += 10) {
    const batch = uniqueIds.slice(i, i + 10)
    await Promise.all(batch.map(async (id) => {
      try {
        const res = await db.collection('boxes').doc(id).get()
        if (res.data) map[id] = res.data
      } catch (err) {
        console.warn('获取盲盒信息失败', id, err.message)
      }
    }))
  }

  return map
}

function getOrderDorms(order, boxMap) {
  let from = order.from_dorm || order.fromDorm
  let to = order.to_dorm || order.toDorm

  if (order.boxInfo) {
    from = from || order.boxInfo.from_dorm || order.boxInfo.fromDorm
    to = to || order.boxInfo.to_dorm || order.boxInfo.toDorm
  }

  if (order.address) {
    from = from || order.address.from_dorm || order.address.fromDorm
    to = to || order.address.to_dorm || order.address.toDorm
  }

  const boxId = order.box_id || order.boxId
  if (boxId && boxMap[boxId]) {
    const box = boxMap[boxId]
    from = from || box.from_dorm
    to = to || box.to_dorm
  }

  return {
    from: normalizeDorm(from),
    to: normalizeDorm(to)
  }
}

function filterOrdersByWindow(orders, hours) {
  if (hours == null) return orders
  const since = Date.now() - hours * 60 * 60 * 1000
  return orders.filter((order) => {
    const t = getOrderTime(order)
    return t === 0 || t >= since
  })
}

function filterBoxesByWindow(boxes, hours) {
  if (hours == null) return boxes
  const since = Date.now() - hours * 60 * 60 * 1000
  return boxes.filter((box) => {
    const t = getBoxTime(box)
    return t === 0 || t >= since
  })
}

function aggregateActivity(orders, boxes, boxMap, hours) {
  const counts = {}
  const windowOrders = filterOrdersByWindow(orders, hours)
  const windowBoxes = filterBoxesByWindow(boxes, hours)

  windowOrders.forEach((order) => {
    const { from, to } = getOrderDorms(order, boxMap)
    addCount(counts, from, 1)
    if (to && to !== from) addCount(counts, to, 1)
  })

  windowBoxes.forEach((box) => {
    const dorm = normalizeDorm(box.from_dorm)
    if (!dorm) return
    const sales = Number(box.sales) || 0
    addCount(counts, dorm, sales > 0 ? sales : 1)
  })

  return counts
}

function getTotalCount(counts) {
  return Object.values(counts).reduce((sum, n) => sum + n, 0)
}

function buildRanking(counts) {
  const dormSet = new Set([...DEFAULT_DORMS, ...Object.keys(counts)])

  const ranked = [...dormSet].map((dorm) => ({
    dorm,
    count: counts[dorm] || 0
  }))

  ranked.sort((a, b) => b.count - a.count)

  const top = ranked.slice(0, 8)
  const maxCount = top[0]?.count || 0

  return top.map((item) => ({
    ...item,
    level: getLevel(item.count, maxCount),
    percent: maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0
  }))
}

exports.main = async (event) => {
  try {
    const [orders, boxes] = await Promise.all([
      fetchCollection('orders'),
      fetchCollection('boxes')
    ])

    const boxIds = [
      ...orders.map((order) => order.box_id || order.boxId),
      ...orders.map((order) => order.boxInfo && (order.boxInfo._id || order.boxInfo.id))
    ]
    const boxMap = await buildBoxMap(boxIds)

    let counts = {}
    let usedHours = 24

    for (const hours of TIME_WINDOWS) {
      counts = aggregateActivity(orders, boxes, boxMap, hours)
      if (getTotalCount(counts) > 0) {
        usedHours = hours
        break
      }
    }

    const activityTotal = getTotalCount(counts)
    const isDemo = activityTotal === 0

    // 验证宿舍名称，只保留有效的宿舍楼
    const validDormSet = new Set(MAIN_DORMS)
    const validatedCounts = {}
    for (const [dorm, count] of Object.entries(counts)) {
      if (validDormSet.has(dorm)) {
        validatedCounts[dorm] = count
      }
    }

    const dormHeat = isDemo || Object.keys(validatedCounts).length === 0
      ? getDemoDormHeat()
      : buildRanking(validatedCounts)

    return {
      success: true,
      data: dormHeat,
      meta: {
        version: 2,
        windowHours: isDemo ? 24 : usedHours,
        orderTotal: orders.length,
        boxTotal: boxes.length,
        activityTotal: isDemo ? dormHeat.reduce((s, d) => s + d.count, 0) : activityTotal,
        isDemo: isDemo || Object.keys(validatedCounts).length === 0,
        updatedAt: Date.now()
      }
    }
  } catch (error) {
    console.error('获取宿舍热度失败:', error)
    return {
      success: false,
      error: error.message,
      data: getDemoDormHeat(),
      meta: { isDemo: true, version: 2 }
    }
  }
}
