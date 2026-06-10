Page({
  data: {
    activeTab: 'open',
    rankData: [],
    myRank: {}
  },

  onLoad() {
    this.loadRankData('open')
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.loadRankData(tab)
  },

  loadRankData(tab) {
    const mockData = {
      open: {
        list: [
          { name: '小明', avatar: '', value: '328', unit: '个', campus: '竹苑A栋' },
          { name: '小红', avatar: '', value: '256', unit: '个', campus: '松苑B栋' },
          { name: '小李', avatar: '', value: '201', unit: '个', campus: '梅苑C栋' },
          { name: '小王', avatar: '', value: '189', unit: '个', campus: '竹苑B栋' },
          { name: '小张', avatar: '', value: '167', unit: '个', campus: '松苑A栋' },
          { name: '小刘', avatar: '', value: '145', unit: '个', campus: '梅苑A栋' },
          { name: '小陈', avatar: '', value: '132', unit: '个', campus: '竹苑C栋' },
          { name: '小黄', avatar: '', value: '120', unit: '个', campus: '松苑B栋' },
        ],
        my: { rank: 12, name: '我', avatar: '', value: '89个' }
      },
      rider: {
        list: [
          { name: '阿强', avatar: '', value: '156', unit: '单', campus: '竹苑A栋' },
          { name: '阿珍', avatar: '', value: '142', unit: '单', campus: '松苑B栋' },
          { name: '阿伟', avatar: '', value: '128', unit: '单', campus: '梅苑C栋' },
          { name: '阿芳', avatar: '', value: '115', unit: '单', campus: '竹苑B栋' },
          { name: '阿东', avatar: '', value: '98', unit: '单', campus: '松苑A栋' },
          { name: '阿雪', avatar: '', value: '87', unit: '单', campus: '梅苑A栋' },
          { name: '阿杰', avatar: '', value: '76', unit: '单', campus: '竹苑C栋' },
          { name: '阿文', avatar: '', value: '65', unit: '单', campus: '松苑B栋' },
        ],
        my: { rank: 23, name: '我', avatar: '', value: '34单' }
      },
      social: {
        list: [
          { name: '欢欢', avatar: '', value: '892', unit: '赞', campus: '梅苑A栋' },
          { name: '乐乐', avatar: '', value: '756', unit: '赞', campus: '竹苑B栋' },
          { name: '天天', avatar: '', value: '623', unit: '赞', campus: '松苑C栋' },
          { name: '西西', avatar: '', value: '589', unit: '赞', campus: '梅苑B栋' },
          { name: '北北', avatar: '', value: '521', unit: '赞', campus: '竹苑A栋' },
          { name: '东东', avatar: '', value: '467', unit: '赞', campus: '松苑A栋' },
          { name: '南南', avatar: '', value: '412', unit: '赞', campus: '梅苑C栋' },
          { name: '中中', avatar: '', value: '378', unit: '赞', campus: '竹苑C栋' },
        ],
        my: { rank: 8, name: '我', avatar: '', value: '245赞' }
      }
    }

    const data = mockData[tab]
    this.setData({
      rankData: data.list.map(d => ({
        ...d,
        avatar: d.avatar || '/images/default-avatar.png'
      })),
      myRank: { ...data.my, avatar: data.my.avatar || '/images/default-avatar.png' }
    })
  }
})
