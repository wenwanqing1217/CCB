// 消息页面 - 紫色霓虹灯主题

Page({
  data: {
    // 未读消息数量
    systemUnread: 2,
    orderUnread: 1,
    interactUnread: 3,
    loveUnread: 0,
    
    // 最近消息
    recentMessages: [
      {
        id: '1',
        name: '系统通知',
        avatar: '',
        icon: '📢',
        message: '欢迎使用校园盲盒小程序，新用户专享福利等你来领！',
        time: '10:30',
        unread: true,
        type: 'system'
      },
      {
        id: '2',
        name: '订单消息',
        avatar: '',
        icon: '📦',
        message: '🎉 恭喜！您的精美文具套装盲盒已下单成功，等待卖家发货',
        time: '昨天',
        unread: true,
        type: 'order',
        orderId: '123456'
      },
      {
        id: '3',
        name: '物流通知',
        avatar: '',
        icon: '🚚',
        message: '骑手小王已取件！正在派送中，预计30分钟内送达中园公寓3栋',
        time: '30分钟前',
        unread: true,
        type: 'logistics',
        orderId: '123456'
      },
      {
        id: '4',
        name: '互动消息',
        avatar: '',
        icon: '💬',
        message: '有人评论了您发布的盲盒：这个盲盒太棒了！',
        time: '2小时前',
        unread: true,
        type: 'interact'
      },
      {
        id: '5',
        name: '张三',
        avatar: 'https://picsum.photos/100/100?random=36',
        message: '这个盲盒还有吗？我想买',
        time: '14:20',
        unread: false,
        type: 'chat'
      },
      {
        id: '6',
        name: '李四',
        avatar: 'https://picsum.photos/100/100?random=37',
        message: '好的，明天下午东区见',
        time: '星期一',
        unread: false,
        type: 'chat'
      }
    ]
  },

  onLoad() {
    console.log('消息页面加载');
  },

  onShow() {
    console.log('消息页面显示');
    this.syncUnreadStats();
    // 设置自定义 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      })
    }
  },

  // 返回上一页
  goBack() {
    console.log('返回上一页');
    wx.navigateBack({
      delta: 1,
      success: function(res) {
        console.log('返回成功');
      },
      fail: function(err) {
        console.error('返回失败:', err);
        // 如果返回失败，跳转到首页
        wx.switchTab({ 
          url: '../index/index',
          success: function() {
            console.log('跳转到首页成功');
          }
        });
      }
    });
  },

  // 跳转到系统消息
  goToSystemMessage() {
    console.log('跳转到系统消息');
    this.setData({ systemUnread: 0 });
    wx.navigateTo({
      url: '/pages/system-message/system-message',
      success: function(res) {
        console.log('跳转到系统消息页面成功');
      },
      fail: function(err) {
        console.error('跳转到系统消息页面失败:', err);
        wx.showToast({
          title: '系统消息页面正在开发中',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 跳转到订单消息
  goToOrderMessage() {
    console.log('跳转到订单消息');
    this.setData({ orderUnread: 0 });
    wx.navigateTo({
      url: '/pages/order-message/order-message',
      success: function(res) {
        console.log('跳转到订单消息页面成功');
      },
      fail: function(err) {
        console.error('跳转到订单消息页面失败:', err);
        wx.showToast({
          title: '订单消息页面正在开发中',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 跳转到物流通知
  goToLogisticsMessage() {
    console.log('跳转到物流通知');
    this.setData({ orderUnread: 0 });
    wx.navigateTo({
      url: '/pages/logistics-detail/logistics-detail',
      success: function(res) {
        console.log('跳转到物流详情页面成功');
      },
      fail: function(err) {
        console.error('跳转到物流详情页面失败:', err);
        wx.showToast({
          title: '跳转失败，请稍后重试',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 跳转到互动消息
  goToInteractMessage() {
    console.log('跳转到互动消息');
    this.setData({ interactUnread: 0 });
    wx.showToast({
      title: '互动消息页面正在开发中',
      icon: 'none',
      duration: 1500
    });
  },

  // 跳转到爱心动态
  goToLove() {
    console.log('跳转到爱心动态');
    this.setData({ loveUnread: 0 });
    wx.switchTab({
      url: '../love/love',
      success: function(res) {
        console.log('跳转到爱心页面成功');
      },
      fail: function(err) {
        console.error('跳转到爱心页面失败:', err);
        wx.showToast({
          title: '爱心页面正在开发中',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 跳转到艾米助手
  goToAI() {
    console.log('跳转到艾米助手');
    wx.navigateTo({
      url: '../ai/ai',
      success: function(res) {
        console.log('跳转到艾米助手成功');
      },
      fail: function(err) {
        console.error('跳转到艾米助手失败:', err);
        wx.showToast({
          title: '艾米助手页面正在开发中',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 跳转到订单详情
  goToOrderDetail(orderId) {
    console.log('跳转到订单详情:', orderId);
    wx.navigateTo({
      url: `../order-detail/order-detail?id=${orderId}`,
      success: function(res) {
        console.log('跳转到订单详情页面成功');
      },
      fail: function(err) {
        console.error('跳转到订单详情页面失败:', err);
        wx.showToast({
          title: '订单详情页面正在开发中',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 跳转到物流详情
  goToLogisticsDetail(orderId) {
    console.log('跳转到物流详情:', orderId);
    wx.navigateTo({
      url: `../logistics-detail/logistics-detail?id=${orderId}`,
      success: function(res) {
        console.log('跳转到物流详情页面成功');
      },
      fail: function(err) {
        console.error('跳转到物流详情页面失败:', err);
        wx.showToast({
          title: '跳转失败，请稍后重试',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 处理消息点击
  handleMessageTap(e) {
    console.log('消息点击:', e);
    const item = e.currentTarget.dataset.item;
    console.log('点击的消息:', item);
    
    // 标记为已读
    if (item.unread) {
      console.log('标记为已读:', item.id);
      const recentMessages = this.data.recentMessages.map(msg => {
        if (msg.id === item.id) {
          return { ...msg, unread: false };
        }
        return msg;
      });
      
      // 更新对应分类的未读数
      let { systemUnread, orderUnread, interactUnread, loveUnread } = this.data;
      if (item.type === 'system') systemUnread = Math.max(0, systemUnread - 1);
      else if (item.type === 'order' || item.type === 'logistics') orderUnread = Math.max(0, orderUnread - 1);
      else if (item.type === 'interact') interactUnread = Math.max(0, interactUnread - 1);
      else if (item.type === 'chat') loveUnread = Math.max(0, loveUnread - 1);
      
      this.setData({ 
        recentMessages,
        systemUnread,
        orderUnread,
        interactUnread,
        loveUnread
      }, () => {
        console.log('已读状态更新成功');
        this.syncUnreadStats();
      });
    }
    
    // 根据消息类型处理点击
    switch (item.type) {
      case 'system':
        console.log('处理系统消息点击');
        this.goToSystemMessage();
        break;
      case 'order':
        console.log('处理订单消息点击');
        if (item.orderId) {
          this.goToOrderDetail(item.orderId);
        } else {
          this.goToOrderMessage();
        }
        break;
      case 'logistics':
        console.log('处理物流消息点击');
        if (item.orderId) {
          this.goToLogisticsDetail(item.orderId);
        } else {
          this.goToLogisticsMessage();
        }
        break;
      case 'interact':
        console.log('处理互动消息点击');
        this.goToInteractMessage();
        break;
      case 'chat':
        console.log('处理聊天消息点击');
        // 跳转到聊天页面
        wx.navigateTo({
          url: `../chat/chat?userId=${item.id}&userName=${item.name}`,
          success: function(res) {
            console.log('跳转到聊天页面成功');
          },
          fail: function(err) {
            console.error('跳转到聊天页面失败:', err);
            wx.showToast({
              title: '聊天页面正在开发中',
              icon: 'none',
              duration: 1500
            });
          }
        });
        break;
    }
  },

  // 同步未读消息统计到本地存储
  syncUnreadStats() {
    const { systemUnread, orderUnread, interactUnread, loveUnread } = this.data;
    const total = systemUnread + orderUnread + interactUnread + loveUnread;
    const stats = {
      system: systemUnread,
      order: orderUnread,
      interact: interactUnread,
      love: loveUnread,
      total: total
    };
    wx.setStorageSync('unreadStats', stats);
    console.log('同步未读消息统计:', stats);
  },

  // 全部已读
  markAllRead() {
    console.log('全部已读');
    const recentMessages = this.data.recentMessages.map(msg => ({
      ...msg,
      unread: false
    }));
    
    this.setData({
      recentMessages,
      systemUnread: 0,
      orderUnread: 0,
      interactUnread: 0,
      loveUnread: 0
    }, () => {
      console.log('全部已读状态更新成功');
      this.syncUnreadStats();
      wx.showToast({
        title: '已全部标记为已读',
        icon: 'success',
        duration: 1000
      });
    });
  },

  // 清除已读
  clearAllRead() {
    console.log('清除已读');
    wx.showModal({
      title: '提示',
      content: '确定要清除所有已读消息吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认清除已读');
          const recentMessages = this.data.recentMessages.filter(msg => msg.unread);
          this.setData({ recentMessages }, function() {
            console.log('清除已读消息成功');
            wx.showToast({
              title: '已清除已读消息',
              icon: 'success',
              duration: 1000
            });
          });
        } else {
          console.log('用户取消清除已读');
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '校园盲盒 - 消息中心',
      path: '/pages/message/message'
    };
  }
});
