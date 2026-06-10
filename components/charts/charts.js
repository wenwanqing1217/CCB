Component({
  properties: {
    type:        { type: String,  value: 'ring' },
    data:        { type: Array,   value: [], observer: 'onDataChange' },
    width:       { type: Number,  value: 500 },
    height:      { type: Number,  value: 400 },
    barColor:    { type: String,  value: '#9370DB' },
    lineColor:   { type: String,  value: '#9370DB' },
    fillColor:   { type: String,  value: 'rgba(147,112,219,0.15)' },
    strokeWidth: { type: Number,  value: 40 },
    animate:     { type: Boolean, value: true }
  },

  data: {
    segments: [],
    total: 0,
    centerX: 0,
    centerY: 0,
    radius: 0,
    yLabels: [],
    barChartWidth: 0,
    linePath: '',
    areaPath: '',
    lineViewBoxW: 600,
    gridLines: [],
    heatGrid: [],
    heatLegend: [],
    colors: ['#9370DB', '#7C3AED', '#BA55D3', '#C8A2FF', '#6D28D9', '#A78BFA']
  },

  methods: {
    onDataChange() {
      if (this.properties.data && this.properties.data.length > 0) {
        this.renderChart()
      }
    },

    renderChart() {
      const type = this.properties.type
      if (type === 'ring') this.renderRing()
      else if (type === 'bar') this.renderBar()
      else if (type === 'line') this.renderLine()
      else if (type === 'heatmap') this.renderHeatmap()
    },

    renderRing() {
      const { data, width, height, strokeWidth } = this.properties
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 2 - strokeWidth / 2 - 10
      const circumference = 2 * Math.PI * radius
      const total = data.reduce((sum, item) => sum + (item.value || 0), 0)
      const colors = this.data.colors

      let currentOffset = 0
      const segments = data.map((item, i) => {
        const percent = total > 0 ? item.value / total : 0
        const length = percent * circumference
        const dasharray = `${length} ${circumference - length}`
        const dashoffset = -currentOffset
        currentOffset += length
        return {
          dasharray,
          dashoffset: -currentOffset,
          color: item.color || colors[i % colors.length]
        }
      })

      this.setData({
        segments, total, centerX, centerY, radius,
        labels: data.map(d => d.label)
      })
    },

    renderBar() {
      const { data, height, barColor } = this.properties
      const colors = this.data.colors
      const maxVal = Math.max(...data.map(d => d.value || 0), 1)
      const barWidth = Math.max(60, Math.min(120, (this.properties.width || 500) / data.length - 10))
      const barChartWidth = Math.max(this.properties.width, data.length * (barWidth + 10) + 20)

      const yMax = Math.ceil(maxVal * 1.2 / Math.pow(10, Math.floor(Math.log10(maxVal)))) * Math.pow(10, Math.floor(Math.log10(maxVal)))
      const yLabels = []
      for (let i = 0; i <= 4; i++) {
        yLabels.push(Math.round(yMax * i / 4))
      }

      const items = data.map((d, i) => ({
        ...d,
        percent: (d.value / yMax) * 100,
        displayValue: d.value >= 1000 ? (d.value / 1000).toFixed(1) + 'k' : d.value,
        color: d.color || (barColor !== '#9370DB' ? barColor : colors[i % colors.length])
      }))

      this.setData({
        yLabels: yLabels.reverse(),
        barChartWidth,
        data: items
      })
    },

    renderLine() {
      const { data, height, lineColor, fillColor } = this.properties
      if (data.length < 2) return

      const w = Math.max(600, data.length * 60)
      const padding = { top: 20, bottom: 30, left: 10, right: 10 }
      const chartW = w - padding.left - padding.right
      const chartH = height - padding.top - padding.bottom
      const values = data.map(d => d.value)
      const maxVal = Math.max(...values, 1)
      const minVal = Math.min(...values, 0)
      const range = maxVal - minVal || 1

      const points = data.map((d, i) => ({
        x: padding.left + (chartW * i) / (data.length - 1),
        y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
        label: d.label,
        cx: padding.left + (chartW * i) / (data.length - 1),
        cy: padding.top + chartH - ((d.value - minVal) / range) * chartH,
        labelX: (i / (data.length - 1)) * 100
      }))

      // Generate smooth line path
      let linePath = ''
      for (let i = 0; i < points.length; i++) {
        if (i === 0) {
          linePath += `M ${points[i].x} ${points[i].y}`
        } else {
          const prev = points[i - 1]
          const cpx = (prev.x + points[i].x) / 2
          linePath += ` C ${cpx} ${prev.y}, ${cpx} ${points[i].y}, ${points[i].x} ${points[i].y}`
        }
      }

      // Area path (close back to bottom)
      const last = points[points.length - 1]
      const first = points[0]
      const bottomY = height - padding.bottom
      const areaPath = linePath + ` L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`

      // Grid lines
      const gridLines = []
      for (let i = 0; i <= 4; i++) {
        gridLines.push({
          y1: padding.top + (chartH * i) / 4,
          y2: padding.top + (chartH * i) / 4
        })
      }

      this.setData({
        linePath,
        areaPath,
        lineViewBoxW: w,
        gridLines: gridLines.map(g => g.y1),
        data: points
      })
    },

    renderHeatmap() {
      const { data, width, height } = this.properties
      const cols = 7
      const rows = Math.ceil((data.length || 28) / cols)
      const values = data.map(d => d.value || 0)
      const maxVal = Math.max(...values, 1)

      const grid = []
      for (let r = 0; r < rows; r++) {
        const row = []
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c
          row.push(idx < data.length ? data[idx].value : 0)
        }
        grid.push(row)
      }

      this.setData({
        heatGrid: grid,
        heatLegend: [
          { color: 'rgba(147,112,219,0.15)', label: '低' },
          { color: 'rgba(147,112,219,0.4)', label: '中' },
          { color: 'rgba(147,112,219,0.7)', label: '高' },
          { color: '#9370DB', label: '最高' }
        ]
      })
    },

    getHeatColor(col, row) {
      const grid = this.data.heatGrid
      if (!grid[row] || grid[row][col] === undefined) return 'rgba(255,255,255,0.03)'
      const val = grid[row][col]
      if (val === 0) return 'rgba(255,255,255,0.03)'
      if (val < 25) return 'rgba(147,112,219,0.15)'
      if (val < 50) return 'rgba(147,112,219,0.3)'
      if (val < 75) return 'rgba(147,112,219,0.5)'
      return 'rgba(147,112,219,0.7)'
    },

    onCellTap(e) {
      const { row, col } = e.currentTarget.dataset
      this.triggerEvent('celltap', { row, col })
    }
  }
})
