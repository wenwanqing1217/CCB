const cloud = require('../../../utils/cloud.js')
const ui = require('../../../utils/ui.js')

Page({
  data: {
    todayStats: {
      orders: 0,
      completed: 0,
      earnings: 0,
      rating: 0
    },
    weeklyStats: {
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      data: [0, 0, 0, 0, 0, 0, 0]
    },
    monthlyStats: {
      totalOrders: 0,
      totalEarnings: 0,
      avgRating: 0,
      activeDays: 0
    },
    chartData: [],
    isLoading: false
  },

  onLoad() {
    this.loadStats()
  },

  onPullDownRefresh() {
    this.loadStats()
  },

  async loadStats() {
    this.setData({ isLoading: true })
    
    try {
      const [todayResult, weeklyResult, monthlyResult] = await Promise.all([
        cloud.callCloudFunction({
          name: 'deliveryService',
          data: { action: 'getTodayStats' }
        }),
        cloud.callCloudFunction({
          name: 'deliveryService',
          data: { action: 'getWeeklyStats' }
        }),
        cloud.callCloudFunction({
          name: 'deliveryService',
          data: { action: 'getMonthlyStats' }
        })
      ])

      this.setData({
        todayStats: todayResult?.success ? todayResult.data : this.getMockTodayStats(),
        weeklyStats: weeklyResult?.success ? weeklyResult.data : this.getMockWeeklyStats(),
        monthlyStats: monthlyResult?.success ? monthlyResult.data : this.getMockMonthlyStats()
      })

      this.renderChart()
    } catch (error) {
      console.error('加载统计数据失败:', error)
      this.setData({
        todayStats: this.getMockTodayStats(),
        weeklyStats: this.getMockWeeklyStats(),
        monthlyStats: this.getMockMonthlyStats()
      })
      this.renderChart()
    } finally {
      this.setData({ isLoading: false })
      wx.stopPullDownRefresh()
    }
  },

  getMockTodayStats() {
    return {
      orders: 5,
      completed: 4,
      earnings: 45,
      rating: 4.8
    }
  },

  getMockWeeklyStats() {
    return {
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      data: [3, 5, 4, 6, 8, 12, 10]
    }
  },

  getMockMonthlyStats() {
    return {
      totalOrders: 128,
      totalEarnings: 1152,
      avgRating: 4.7,
      activeDays: 22
    }
  },

  renderChart() {
    const ctx = wx.createCanvasContext('statsChart')
    const data = this.data.weeklyStats.data
    const labels = this.data.weeklyStats.labels
    
    const width = 300
    const height = 150
    const padding = { top: 20, right: 20, bottom: 30, left: 30 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    
    const maxValue = Math.max(...data) * 1.2
    const barWidth = chartWidth / data.length * 0.7
    const gap = chartWidth / data.length * 0.3
    
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(0, 0, width, height)
    
    ctx.setStrokeStyle('#eeeeee')
    ctx.setLineWidth(1)
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }
    
    data.forEach((value, index) => {
      const x = padding.left + index * (barWidth + gap) + gap / 2
      const barHeight = (value / maxValue) * chartHeight
      const y = padding.top + chartHeight - barHeight
      
      const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartHeight)
      gradient.addColorStop(0, '#576B95')
      gradient.addColorStop(1, '#8FA3BF')
      
      ctx.setFillStyle(gradient)
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, 4)
      ctx.fill()
      
      ctx.setFillStyle('#666666')
      ctx.setFontSize(10)
      ctx.setTextAlign('center')
      ctx.fillText(labels[index], x + barWidth / 2, height - 10)
    })
    
    ctx.draw()
  },

  viewOrderHistory() {
    wx.navigateTo({ url: '/pages/delivery/delivery' })
  },

  async viewRatingDetail() {
    ui.loadingStates.showToast('评价详情开发中', 'none')
  },

  goBack() {
    wx.navigateBack()
  }
})