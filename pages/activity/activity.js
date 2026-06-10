Page({
  data: {
    activeActivities: [
      {
        id: 'act1',
        title: '🎊 夏日开盒节',
        description: '活动期间开启盲盒，双倍积分奖励！还有限定稀有度加成~',
        image: '',
        remaining: '2天 15小时',
        participants: 328,
        tag: 'HOT',
        tagType: 'hot',
        color: 'purple',
        progress: 65,
        progressText: '已完成 65% 目标'
      },
      {
        id: 'act2',
        title: '🚀 新骑手冲刺赛',
        description: '新注册骑手完成首单奖励50积分，周冠军额外获得限定徽章',
        image: '',
        remaining: '5天 08小时',
        participants: 156,
        tag: 'NEW',
        tagType: 'new',
        color: 'blue',
        progress: 42,
        progressText: '42位新骑手已参与'
      },
      {
        id: 'act3',
        title: '💝 爱心捐赠月',
        description: '将闲置物品捐赠给有需要的同学，每件捐赠获得双倍爱心积分',
        image: '',
        remaining: '12天 06小时',
        participants: 89,
        tag: '限时',
        tagType: 'limited',
        color: 'green',
        progress: 30,
        progressText: '89件物品已捐赠'
      }
    ],
    endedActivities: [
      {
        id: 'end1',
        title: '🎉 开学季特惠',
        description: '开学盲盒全场8折，新人专享首单5折优惠',
        image: '',
        result: '共有 1,234 位同学参与活动'
      },
      {
        id: 'end2',
        title: '🏆 春季开盒大赛',
        description: '月度开盒数量PK，前十名获得限定稀有盲盒',
        image: '',
        result: '冠军开盒 176 次，活动圆满结束'
      }
    ]
  },

  showDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: '活动详情开发中',
      icon: 'none',
      duration: 1500
    })
  }
})
