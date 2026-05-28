// 系统通知页面
Page({
  data: {
    notices: [],
    totalCount: 0,
    unreadCount: 0
  },

  onLoad() {
    this.loadNotices();
  },

  onShow() {
    this.updateUnreadCount();
  },

  onPullDownRefresh() {
    this.loadNotices();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 加载通知数据
  loadNotices() {
    // 模拟数据
    const mockNotices = [
      {
        id: '1',
        type: 'system',
        icon: '🎉',
        title: '欢迎使用校园盲盒',
        content: '感谢您加入CBB校园盲盒！新用户专享福利等你来领，快去发布你的第一个盲盒吧~',
        time: '刚刚',
        read: false,
        action: {
          text: '去发布',
          type: 'navigate',
          url: '/pages/box-publish/box-publish'
        }
      },
      {
        id: '2',
        type: 'activity',
        icon: '🎁',
        title: '限时活动开启',
        content: '本周盲盒发布享双倍积分，快来参与吧！活动时间：4月1日-4月7日',
        time: '2小时前',
        read: false,
        action: {
          text: '查看详情',
          type: 'navigate',
          url: '/pages/activity/activity'
        }
      },
      {
        id: '3',
        type: 'warning',
        icon: '⚠️',
        title: '账号安全提醒',
        content: '检测到您的账号在新设备登录，如非本人操作请及时修改密码。',
        time: '昨天',
        read: true
      },
      {
        id: '4',
        type: 'success',
        icon: '✅',
        title: '实名认证通过',
        content: '恭喜您！实名认证已通过审核，现在可以正常使用所有功能了。',
        time: '3天前',
        read: true
      },
      {
        id: '5',
        type: 'system',
        icon: '📢',
        title: '系统维护通知',
        content: '系统将于4月5日凌晨2:00-4:00进行例行维护，期间部分功能可能无法使用。',
        time: '5天前',
        read: true
      },
      {
        id: '6',
        type: 'activity',
        icon: '🏆',
        title: '恭喜获得称号',
        content: '您在3月份的交易量排名前十，获得"活跃交易者"称号！',
        time: '1周前',
        read: true
      }
    ];

    const totalCount = mockNotices.length;
    const unreadCount = mockNotices.filter(n => !n.read).length;

    this.setData({
      notices: mockNotices,
      totalCount,
      unreadCount
    });
  },

  // 更新未读数量
  updateUnreadCount() {
    const unreadCount = this.data.notices.filter(n => !n.read).length;
    this.setData({ unreadCount });
  },

  // 点击通知
  handleNoticeTap(e) {
    const id = e.currentTarget.dataset.id;
    const notices = this.data.notices.map(notice => {
      if (notice.id === id) {
        return { ...notice, read: true };
      }
      return notice;
    });

    this.setData({ notices }, () => {
      this.updateUnreadCount();
    });
  },

  // 点击操作按钮
  handleAction(e) {
    e.stopPropagation();
    const { action, url } = e.currentTarget.dataset;

    if (action === 'navigate' && url) {
      // 检查是否是tabBar页面
      const tabBarPages = ['/pages/index/index', '/pages/love/love', '/pages/box-publish/box-publish', '/pages/message/message', '/pages/profile/profile'];
      if (tabBarPages.includes(url)) {
        wx.switchTab({ url });
      } else {
        wx.navigateTo({ url });
      }
    }
  },

  // 全部已读
  markAllRead() {
    const notices = this.data.notices.map(notice => ({
      ...notice,
      read: true
    }));

    this.setData({
      notices,
      unreadCount: 0
    }, () => {
      wx.showToast({
        title: '已全部标记为已读',
        icon: 'success',
        duration: 1000
      });
    });
  },

  // 清除已读
  clearRead() {
    wx.showModal({
      title: '提示',
      content: '确定要清除所有已读通知吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          const notices = this.data.notices.filter(n => !n.read);
          this.setData({
            notices,
            totalCount: notices.length
          }, () => {
            wx.showToast({
              title: '已清除已读通知',
              icon: 'success',
              duration: 1000
            });
          });
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '系统通知 - CBB校园盲盒',
      path: '/pages/system-message/system-message'
    };
  }
});
