const cloud = require('../../../utils/cloud.js')

Page({
  data: {
    activeTab: 'orders',
    orderStats: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      data: [120, 150, 180, 220, 190, 250]
    },
    userStats: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      data: [200, 280, 350, 420, 500, 580]
    },
    revenueStats: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      data: [2500, 3200, 4100, 5200, 4800, 6100]
    },
    deliveryStats: {
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      data: [80, 95, 110, 105, 130, 180, 160]
    }
  },

  onLoad() {
    this.loadChartData()
  },

  async loadChartData() {
    try {
      const result = await cloud.callCloudFunction({
        name: 'getDashboardStats',
        data: { period: 'monthly' },
        showLoading: false
      })

      if (result?.success && result.data) {
        const data = result.data
        this.setData({
          orderStats: data.orderStats || this.data.orderStats,
          userStats: data.userStats || this.data.userStats,
          revenueStats: data.revenueStats || this.data.revenueStats,
          deliveryStats: data.deliveryStats || this.data.deliveryStats
        })
      }
    } catch (error) {
      console.error('加载图表数据失败:', error)
    }

    this.renderCharts()
  },

  setTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.renderCharts()
  },

  renderCharts() {
    setTimeout(() => {
      switch (this.data.activeTab) {
        case 'orders':
          this.renderBarChart('orderChart', this.data.orderStats, '订单数', '#576B95')
          break
        case 'users':
          this.renderLineChart('userChart', this.data.userStats, '用户数', '#34A853')
          break
        case 'revenue':
          this.renderBarChart('revenueChart', this.data.revenueStats, '营收(元)', '#FBBC05')
          break
        case 'delivery':
          this.renderBarChart('deliveryChart', this.data.deliveryStats, '配送单量', '#EA4335')
          break
      }
    }, 100)
  },

  renderBarChart(canvasId, data, unit, color) {
    const ctx = wx.createCanvasContext(canvasId)
    const labels = data.labels
    const values = data.data

    const width = 320
    const height = 200
    const padding = { top: 30, right: 20, bottom: 40, left: 40 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    ctx.setFillStyle('#ffffff')
    ctx.fillRect(0, 0, width, height)

    ctx.setStrokeStyle('#f0f0f0')
    ctx.setLineWidth(1)
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    const maxValue = Math.max(...values) * 1.2
    const barWidth = chartWidth / values.length * 0.6
    const gap = chartWidth / values.length * 0.4

    values.forEach((value, index) => {
      const x = padding.left + index * (barWidth + gap) + gap / 2
      const barHeight = (value / maxValue) * chartHeight
      const y = padding.top + chartHeight - barHeight

      const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartHeight)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, this.lightenColor(color, 30))

      ctx.setFillStyle(gradient)
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, 6)
      ctx.fill()

      ctx.setFillStyle('#666666')
      ctx.setFontSize(10)
      ctx.setTextAlign('center')
      ctx.fillText(labels[index], x + barWidth / 2, height - 15)

      ctx.setFillStyle(color)
      ctx.setFontSize(10)
      ctx.fillText(`${value}${unit}`, x + barWidth / 2, y - 8)
    })

    ctx.draw()
  },

  renderLineChart(canvasId, data, unit, color) {
    const ctx = wx.createCanvasContext(canvasId)
    const labels = data.labels
    const values = data.data

    const width = 320
    const height = 200
    const padding = { top: 30, right: 20, bottom: 40, left: 40 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    ctx.setFillStyle('#ffffff')
    ctx.fillRect(0, 0, width, height)

    ctx.setStrokeStyle('#f0f0f0')
    ctx.setLineWidth(1)
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    const maxValue = Math.max(...values) * 1.2
    const stepX = chartWidth / (values.length - 1)

    const points = values.map((value, index) => ({
      x: padding.left + index * stepX,
      y: padding.top + chartHeight - (value / maxValue) * chartHeight
    }))

    ctx.setStrokeStyle(this.lightenColor(color, 20))
    ctx.setLineWidth(20)
    ctx.setLineCap('round')
    ctx.setLineJoin('round')

    const gradient = ctx.createLinearGradient(padding.left, padding.top, padding.left, padding.top + chartHeight)
    gradient.addColorStop(0, this.lightenColor(color, 30))
    gradient.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.beginPath()
    ctx.moveTo(points[0].x, padding.top + chartHeight)
    
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.lineTo(point.x, point.y)
      } else {
        const prevPoint = points[index - 1]
        const cpX = (prevPoint.x + point.x) / 2
        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpX, (prevPoint.y + point.y) / 2)
      }
    })
    
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight)
    ctx.setFillStyle(gradient)
    ctx.fill()

    ctx.setStrokeStyle(color)
    ctx.setLineWidth(3)
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    
    points.forEach((point, index) => {
      if (index === 0) return
      const prevPoint = points[index - 1]
      const cpX = (prevPoint.x + point.x) / 2
      ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpX, (prevPoint.y + point.y) / 2)
    })
    ctx.stroke()

    points.forEach((point) => {
      ctx.setFillStyle('#ffffff')
      ctx.beginPath()
      ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI)
      ctx.fill()

      ctx.setFillStyle(color)
      ctx.beginPath()
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })

    ctx.setFillStyle('#666666')
    ctx.setFontSize(10)
    ctx.setTextAlign('center')
    labels.forEach((label, index) => {
      const x = padding.left + index * stepX
      ctx.fillText(label, x, height - 15)
    })

    ctx.draw()
  },

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, (num >> 16) + amt)
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt)
    const B = Math.min(255, (num & 0x0000ff) + amt)
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
  },

  goBack() {
    wx.navigateBack()
  }
})