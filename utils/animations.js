/**
 * CBB 动画工具库
 * 提供统一的数字滚动、入场动画、抖动效果等
 */

/**
 * 数字滚动动画
 * 从 start 到 end 逐帧递增
 * @param {number} start - 起始值
 * @param {number} end - 目标值
 * @param {number} duration - 动画时长（毫秒）
 * @param {function} onUpdate - 每帧回调，接收当前值
 * @param {function} onComplete - 完成回调
 */
function animateNumber(start, end, duration = 800, onUpdate, onComplete) {
  const startTime = Date.now()
  const diff = end - start

  function tick() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    // easeOutExpo 缓动
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    const current = Math.round(start + diff * eased)

    if (onUpdate) onUpdate(current)

    if (progress < 1) {
      setTimeout(tick, 16)
    } else {
      if (onComplete) onComplete(end)
    }
  }

  tick()
}

/**
 * 入场序列动画（stagger）
 * 为多个元素逐个添加入场动画
 * @param {number} count - 元素数量
 * @param {number} baseDelay - 基础延迟（毫秒）
 * @param {number} staggerDelay - 每个元素递增延迟（毫秒）
 * @param {function} onAnimate - 每个元素的动画回调(index, delay)
 * @param {function} onComplete - 全部完成回调
 */
function staggerAnimate(count, baseDelay = 50, staggerDelay = 80, onAnimate, onComplete) {
  let completed = 0

  for (let i = 0; i < count; i++) {
    const delay = baseDelay + i * staggerDelay
    setTimeout(() => {
      if (onAnimate) onAnimate(i, delay)
      completed++
      if (completed >= count && onComplete) {
        setTimeout(onComplete, 300)
      }
    }, delay)
  }
}

/**
 * 弹性抖动动画
 * @param {function} onFrame - 每帧回调，接收当前 scale 值
 * @param {number} intensity - 抖动强度
 * @param {number} duration - 动画时长
 * @param {function} onComplete - 完成回调
 */
function elasticShake(onFrame, intensity = 1, duration = 500, onComplete) {
  const startTime = Date.now()

  function tick() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    if (progress < 1) {
      // 衰减振荡
      const decay = 1 - progress
      const oscillation = Math.sin(progress * Math.PI * 8) * decay * intensity
      if (onFrame) onFrame(1 + oscillation * 0.05, oscillation * 3)
      setTimeout(tick, 16)
    } else {
      if (onFrame) onFrame(1, 0)
      if (onComplete) onComplete()
    }
  }

  tick()
}

/**
 * 粒子爆发效果数据生成
 * @param {number} count - 粒子数量
 * @param {string} color - 颜色
 * @returns {Array} 粒子配置数组
 */
function generateParticles(count = 20, color = '#9370DB') {
  const particles = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const distance = 80 + Math.random() * 120
    const size = 6 + Math.random() * 10
    particles.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size,
      color,
      delay: Math.random() * 100,
      duration: 400 + Math.random() * 300,
      opacity: 0.6 + Math.random() * 0.4
    })
  }
  return particles
}

/**
 * 随机稀有度生成
 * @returns {string} 稀有度名称
 */
function rollRarity() {
  const rand = Math.random()
  if (rand < 0.4) return 'common'      // 40%
  if (rand < 0.7) return 'uncommon'    // 30%
  if (rand < 0.88) return 'rare'       // 18%
  if (rand < 0.97) return 'epic'       // 9%
  return 'legendary'                    // 3%
}

/**
 * 稀有度配置
 */
const RARITY_CONFIG = {
  common: {
    name: '普通',
    color: '#9CA3AF',
    glowColor: 'rgba(156, 163, 175, 0.6)',
    bgGradient: 'linear-gradient(135deg, #4B5563, #6B7280)',
    particleCount: 15,
    vibrationDuration: 10
  },
  uncommon: {
    name: '稀有',
    color: '#34D399',
    glowColor: 'rgba(52, 211, 153, 0.6)',
    bgGradient: 'linear-gradient(135deg, #065F46, #059669)',
    particleCount: 20,
    vibrationDuration: 15
  },
  rare: {
    name: '精良',
    color: '#60A5FA',
    glowColor: 'rgba(96, 165, 250, 0.6)',
    bgGradient: 'linear-gradient(135deg, #1E3A5F, #2563EB)',
    particleCount: 25,
    vibrationDuration: 20
  },
  epic: {
    name: '史诗',
    color: '#A78BFA',
    glowColor: 'rgba(167, 139, 250, 0.8)',
    bgGradient: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
    particleCount: 30,
    vibrationDuration: 25
  },
  legendary: {
    name: '传说',
    color: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.9)',
    bgGradient: 'linear-gradient(135deg, #92400E, #F59E0B)',
    particleCount: 40,
    vibrationDuration: 30
  }
}

/**
 * 数字动画快捷方法 - 用于 Page 或 Component
 * @param {object} ctx - Page 或 Component 的 this
 * @param {string} dataKey - 要更新的 data 键名
 * @param {number} endValue - 目标值
 * @param {number} duration - 动画时长
 */
function startNumberAnimation(ctx, dataKey, endValue, duration = 800) {
  const startValue = ctx.data[dataKey] || 0
  animateNumber(
    startValue,
    endValue,
    duration,
    (val) => {
      const update = {}
      update[dataKey] = val
      ctx.setData(update)
    },
    () => {
      const update = {}
      update[dataKey] = endValue
      ctx.setData(update)
    }
  )
}

module.exports = {
  animateNumber,
  staggerAnimate,
  elasticShake,
  generateParticles,
  rollRarity,
  RARITY_CONFIG,
  startNumberAnimation
}
