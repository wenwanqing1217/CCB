const RARITY_CONFIG = {
  common:    { name: '普通', color: '#9CA3AF', glow: 'rgba(156,163,175,0.6)', particleCount: 15 },
  uncommon:  { name: '稀有', color: '#34D399', glow: 'rgba(52,211,153,0.6)', particleCount: 20 },
  rare:      { name: '精良', color: '#60A5FA', glow: 'rgba(96,165,250,0.6)', particleCount: 25 },
  epic:      { name: '史诗', color: '#A78BFA', glow: 'rgba(167,139,250,0.8)', particleCount: 30 },
  legendary: { name: '传说', color: '#FBBF24', glow: 'rgba(251,191,36,0.9)', particleCount: 40 }
}

Component({
  properties: {
    show:       { type: Boolean, value: false, observer: 'onShowChange' },
    rarity:     { type: String,  value: 'common' },
    itemName:   { type: String,  value: '' },
    itemImage:  { type: String,  value: '' }
  },

  data: {
    phase: 'idle',
    particles: [],
    lightRays: [],
    rarityLabel: '普通',
    defaultImage: '',
    _timer: null,
    _phaseTimer: null
  },

  observers: {
    rarity(val) {
      const cfg = RARITY_CONFIG[val] || RARITY_CONFIG.common
      this.setData({ rarityLabel: cfg.name })
    }
  },

  methods: {
    noop() {},

    onShowChange(show) {
      if (show) {
        this.startAnimation()
      } else {
        this.clearTimers()
      }
    },

    startAnimation() {
      this.clearTimers()
      
      // 生成光线和粒子数据
      const rays = []
      for (let i = 0; i < 12; i++) {
        rays.push({ angle: (360 / 12) * i, delay: i * 30 })
      }
      const cfg = RARITY_CONFIG[this.properties.rarity] || RARITY_CONFIG.common
      const particles = this.generateParticles(cfg.particleCount, cfg.color)
      
      this.setData({
        phase: 'idle',
        lightRays: rays,
        particles: particles
      })

      // Phase sequence with delays
      const self = this
      this.data._phaseTimer = setTimeout(() => {
        self.setData({ phase: 'shaking' })
        try { wx.vibrateShort({ type: 'medium' }) } catch(e) {}
        
        self.data._phaseTimer = setTimeout(() => {
          self.setData({ phase: 'gathering' })
          try { wx.vibrateShort({ type: 'medium' }) } catch(e) {}
          
          self.data._phaseTimer = setTimeout(() => {
            self.setData({ phase: 'exploding' })
            try { wx.vibrateShort({ type: 'heavy' }) } catch(e) {}
            
            self.data._phaseTimer = setTimeout(() => {
              self.setData({ phase: 'reveal' })
              
              self.data._phaseTimer = setTimeout(() => {
                self.setData({ phase: 'completed' })
                self.triggerEvent('complete', { rarity: self.properties.rarity, name: self.properties.itemName })
              }, 800)
            }, 600)
          }, 800)
        }, 1000)
      }, 500)
    },

    generateParticles(count, color) {
      const particles = []
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
        const distance = 60 + Math.random() * 180
        const size = 4 + Math.random() * 12
        particles.push({
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size,
          color,
          delay: Math.random() * 100,
          duration: 400 + Math.random() * 400,
          opacity: 0.5 + Math.random() * 0.5
        })
      }
      return particles
    },

    clearTimers() {
      if (this.data._phaseTimer) {
        clearTimeout(this.data._phaseTimer)
        this.data._phaseTimer = null
      }
      if (this.data._timer) {
        clearTimeout(this.data._timer)
        this.data._timer = null
      }
    },

    reset() {
      this.clearTimers()
      this.setData({ phase: 'idle' })
    },

    onClose() {
      this.triggerEvent('close', { rarity: this.properties.rarity, name: this.properties.itemName })
      this.reset()
    },

    openAgain() {
      this.triggerEvent('openAgain', {})
      this.reset()
    }
  }
})
