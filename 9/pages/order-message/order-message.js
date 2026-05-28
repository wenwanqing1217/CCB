// 订单消息页面
Page({
  data: {
    messages: [],
    totalCount: 0,
    unreadCount: 0
  },

  onLoad() {
    this.loadMessages();
  },

  onShow() {
    this.updateUnreadCount();
  },

  onPullDownRefresh() {
    this.loadMessages();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 加载订单消息数据
  loadMessages() {
    // 模拟数据 - 订单相关消息
    const mockMessages = [
      {
        id: '1',
        type: 'order_success',
        icon: '🎉',
        title: '下单成功',
        content: '恭喜！您的订单已提交成功，卖家将尽快为您发货。',
        time: '刚刚',
        read: false,
        orderId: '123456',
        orderInfo: {
          name: '精美文具套装盲盒',
          image: 'https://picsum.photos/400/400?random=10',
          price: '29.9'
        },
        action: {
          text: '查看订单',
          type: 'order_detail',
          url: '/pages/order-detail/order-detail'
        }
      },
      {
        id: '2',
        type: 'payment_success',
        icon: '💰',
        title: '付款成功',
        content: '您的订单已付款成功，金额¥29.9，等待卖家发货。',
        time: '5分钟前',
        read: false,
        orderId: '123456',
        orderInfo: {
          name: '精美文具套装盲盒',
          image: 'https://picsum.photos/400/400?random=10',
          price: '29.9'
        },
        action: {
          text: '查看订单',
          type: 'order_detail',
          url: '/pages/order-detail/order-detail'
        }
      },
      {
        id: '3',
        type: 'seller_shipped',
        icon: '📦',
        title: '卖家已发货',
        content: '卖家已将商品交给配送员，请留意物流动态。',
        time: '30分钟前',
        read: false,
        orderId: '123456',
        orderInfo: {
          name: '精美文具套装盲盒',
          image: 'https://picsum.photos/400/400?random=10',
          price: '29.9'
        },
        action: {
          text: '查看物流',
          type: 'logistics',
          url: '/pages/logistics-detail/logistics-detail'
        }
      },
      {
        id: '4',
        type: 'order_cancelled',
        icon: '❌',
        title: '订单已取消',
        content: '您的订单已取消，退款将在1-3个工作日内原路退回。',
        time: '昨天',
        read: true,
        orderId: '123455',
        orderInfo: {
          name: '零食大礼包',
          image: 'https://picsum.photos/400/400?random=11',
          price: '19.9'
        }
      },
      {
        id: '5',
        type: 'order_completed',
        icon: '✅',
        title: '订单已完成',
        content: '您的订单已完成，期待您的评价！',
        time: '3天前',
        read: true,
        orderId: '123450',
        orderInfo: {
          name: '数码配件盲盒',
          image: 'https://picsum.photos/400/400?random=12',
          price: '39.9'
        },
        action: {
          text: '去评价',
          type: 'review',
          url: '/pages/review/review'
        }
      },
      {
        id: '6',
        type: 'refund_success',
        icon: '💸',
        title: '退款成功',
        content: '您的退款申请已通过，金额¥19.9已原路退回。',
        time: '1周前',
        read: true,
        orderId: '123445',
        orderInfo: {
          name: '生活用品盲盒',
          image: 'https://picsum.photos/400/400?random=13',
          price: '19.9'
        }
      }
    ];

    const totalCount = mockMessages.length;
    const unreadCount = mockMessages.filter(m => !m.read).length;

    this.setData({
      messages: mockMessages,
      totalCount,
      unreadCount
    });
  },

  // 更新未读数量
  updateUnreadCount() {
    const unreadCount = this.data.messages.filter(m => !m.read).length;
    this.setData({ unreadCount });
  },

  // 点击消息
  handleMessageTap(e) {
    const id = e.currentTarget.dataset.id;
    const messages = this.data.messages.map(msg => {
      if (msg.id === id) {
        return { ...msg, read: true };
      }
      return msg;
    });

    this.setData({ messages }, () => {
      this.updateUnreadCount();
    });
  },

  // 点击操作按钮
  handleAction(e) {
    e.stopPropagation();
    const { action, url, orderid } = e.currentTarget.dataset;

    if (action === 'order_detail' && orderid) {
      wx.navigateTo({
        url: `${url}?id=${orderid}`
      });
    } else if (action === 'logistics' && orderid) {
      wx.navigateTo({
        url: `${url}?id=${orderid}`
      });
    } else if (action === 'review' && orderid) {
      wx.navigateTo({
        url: `${url}?id=${orderid}`
      });
    } else if (url) {
      wx.navigateTo({ url });
    }
  },

  // 全部已读
  markAllRead() {
    const messages = this.data.messages.map(msg => ({
      ...msg,
      read: true
    }));

    this.setData({
      messages,
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
      content: '确定要清除所有已读消息吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          const messages = this.data.messages.filter(m => !m.read);
          this.setData({
            messages,
            totalCount: messages.length
          }, () => {
            wx.showToast({
              title: '已清除已读消息',
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
      title: '订单消息 - CBB校园盲盒',
      path: '/pages/order-message/order-message'
    };
  }
});
