Page({
  data: {
    checkedIn: false,
    streak: 5,
    todayReward: 10,
    dailyReward: 10,
    year: 2026,
    month: 6,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    emptyDays: [],
    days: [],
    monthCheckins: 12,
    records: [
      { date: '2026-06-10', reward: 10, time: '08:30' },
      { date: '2026-06-09', reward: 10, time: '09:15' },
      { date: '2026-06-08', reward: 10, time: '07:50' },
      { date: '2026-06-07', reward: 15, time: '10:00' },
      { date: '2026-06-06', reward: 10, time: '08:20' },
    ],
    streakRewards: [
      { day: 7, reward: '50积分' },
      { day: 15, reward: '100积分' },
      { day: 21, reward: '稀有盲盒券' },
      { day: 30, reward: '史诗盲盒券' },
    ]
  },

  onLoad() {
    this.renderCalendar()
  },

  renderCalendar() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const today = now.getDate()

    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()

    const emptyDays = Array(firstDay).fill(0)
    const days = []

    // Simulate checked days
    const checkedDays = [1, 2, 3, 4, 5, 8, 9, 10]
    const canCheckin = !this.data.checkedIn && !checkedDays.includes(today)

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        checked: checkedDays.includes(d),
        today: d === today,
        canCheckin: canCheckin && d === today
      })
    }

    this.setData({ year, month, emptyDays, days })
  },

  doCheckin() {
    if (this.data.checkedIn) return

    const reward = this.data.streak >= 7 ? 15 : 10

    // Animation sequence
    wx.vibrateShort({ type: 'medium' })
    
    wx.showToast({
      title: `签到成功 +${reward}积分`,
      icon: 'none',
      duration: 1500
    })

    const newStreak = this.data.streak + 1
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
    const timeStr = `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`

    this.setData({
      checkedIn: true,
      streak: newStreak,
      todayReward: reward,
      monthCheckins: this.data.monthCheckins + 1,
      records: [{ date: dateStr, reward, time: timeStr }, ...this.data.records]
    })

    this.renderCalendar()
  },

  onDayTap(e) {
    const day = e.currentTarget.dataset.day
    const now = new Date()
    if (day === now.getDate() && !this.data.checkedIn) {
      this.doCheckin()
    }
  }
})
