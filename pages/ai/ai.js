const app = getApp();

Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    scrollToView: '',
    showAITip: true,
    showQuickSection: true,
    userInfo: null,
    unreadStats: {
      system: 2,
      order: 1,
      interact: 3,
      total: 6
    },
    pendingAction: null,
    defaultAvatar: require('../../utils/placeholders').DEFAULT_AVATAR
  },

  onLoad(options) {
    this.checkUserInfo();
    this.loadUnreadStats();
    this.setData({
      messages: [{
        type: 'ai',
        content: '你好！我是艾米，你的校园智能助手。有什么我可以帮你的吗？',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: false
      }]
    });
  },

  onShow() {
    this.checkAITip();
    this.loadUnreadStats();
  },

  checkUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  checkAITip() {
    const hideAITip = wx.getStorageSync('hideAITip');
    if (hideAITip) {
      this.setData({ showAITip: false });
    }
  },

  closeAITip() {
    this.setData({ showAITip: false });
    wx.setStorageSync('hideAITip', true);
  },

  loadUnreadStats() {
    const stats = wx.getStorageSync('unreadStats') || {
      system: 2,
      order: 1,
      interact: 3,
      total: 6
    };
    this.setData({ unreadStats: stats });
  },

  onInputChange(e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendMessage() {
    if (!this.data.inputValue.trim() || this.data.loading) {
      return;
    }

    const userMessage = this.data.inputValue.trim();
    const message = {
      type: 'user',
      content: userMessage,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    this.setData({
      messages: [...this.data.messages, message],
      inputValue: '',
      loading: true,
      pendingAction: null
    });

    this.scrollToBottom();

    // 调用AI服务云函数
    wx.cloud.callFunction({
      name: 'aiService',
      data: {
        action: 'chat',
        data: {
          message: userMessage
        }
      }
    }).then(res => {
      let reply;
      if (res.result && res.result.response) {
        reply = {
          type: 'ai',
          content: res.result.response,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          showAction: false
        };
        
        if (userMessage.toLowerCase().includes('推荐')) {
          reply.showAction = true;
          reply.actionText = '获取推荐';
          reply.action = 'getRecommendations';
        }
        
        if (userMessage.toLowerCase().includes('润色')) {
          reply.showAction = true;
          reply.actionText = '开始润色';
          reply.action = 'startPolish';
        }
      } else {
        reply = this.getAutoReply(userMessage);
      }
      
      const newMessages = [...this.data.messages, reply];
      this.setData({
        messages: newMessages,
        loading: false,
        pendingAction: reply.action || null
      });
      this.scrollToBottom();
    }).catch(error => {
      console.error('AI服务调用失败，使用本地自动回复', error);
      const reply = this.getAutoReply(userMessage);
      this.setData({
        messages: [...this.data.messages, reply],
        loading: false,
        pendingAction: reply.action || null
      });
      this.scrollToBottom();
    });
  },

  getAutoReply(content) {
    const lowerContent = content.toLowerCase();
    const { unreadStats } = this.data;
    
    if (lowerContent.includes('消息') || lowerContent.includes('新消息') || lowerContent.includes('通知')) {
      if (unreadStats.total > 0) {
        return {
          type: 'ai',
          content: `你有 ${unreadStats.total} 条未读消息：\n• 系统通知：${unreadStats.system} 条\n• 订单消息：${unreadStats.order} 条\n• 互动消息：${unreadStats.interact} 条`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          showAction: true,
          actionText: '前往查看',
          action: 'navigateToMessage'
        };
      } else {
        return {
          type: 'ai',
          content: '你目前没有新消息，所有消息都已读。',
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          showAction: true,
          actionText: '查看历史消息',
          action: 'navigateToMessage'
        };
      }
    }

    if (lowerContent.includes('订单') || lowerContent.includes('我的订单')) {
      return {
        type: 'ai',
        content: '我可以帮你查看所有订单状态，包括待付款、待发货、待收货和已完成的订单。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: true,
        actionText: '查看订单',
        action: 'navigateToOrder'
      };
    }

    if (lowerContent.includes('发布') || lowerContent.includes('卖东西') || lowerContent.includes('发布盲盒')) {
      return {
        type: 'ai',
        content: '发布盲盒很简单，填写商品信息、上传图片、设置价格即可发布。发布的商品如果15天内未售出，会自动进入捐赠通道。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: true,
        actionText: '去发布',
        action: 'navigateToPublish'
      };
    }
    
    if (lowerContent.includes('买') || lowerContent.includes('购物') || lowerContent.includes('盲盒') || lowerContent.includes('逛逛')) {
      return {
        type: 'ai',
        content: '盲盒市场有各种好物等你来发现，包括数码配件、文具、服饰、美妆等分类。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: true,
        actionText: '去逛逛',
        action: 'navigateToMarket'
      };
    }
    
    if (lowerContent.includes('骑手') || lowerContent.includes('配送') || lowerContent.includes('赚钱') || lowerContent.includes('接单')) {
      return {
        type: 'ai',
        content: '成为骑手可以赚取配送费，每单配送费根据距离计算。需要填写相关信息并上传身份证照片，审核通过后即可接单。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: true,
        actionText: '申请成为骑手',
        action: 'navigateToRider'
      };
    }
    
    if (lowerContent.includes('我的') || lowerContent.includes('个人中心') || lowerContent.includes('资料') || lowerContent.includes('设置')) {
      return {
        type: 'ai',
        content: '个人中心可以查看你的订单、发布的商品、收藏、钱包等信息。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: true,
        actionText: '进入个人中心',
        action: 'navigateToProfile'
      };
    }
    
    if (lowerContent.includes('社区') || lowerContent.includes('爱心') || lowerContent.includes('捐赠') || lowerContent.includes('交换')) {
      return {
        type: 'ai',
        content: '社区是大家分享和交流的地方，你可以发布捐赠、交换需求，也可以看看其他同学都在分享什么。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: true,
        actionText: '去社区看看',
        action: 'navigateToCommunity'
      };
    }
    
    if (lowerContent.includes('捐赠规则') || lowerContent.includes('捐赠')) {
      return {
        type: 'ai',
        content: '捐赠规则：发布的商品如果15天内未售出，会自动进入捐赠通道，你可以选择继续出售或捐赠给有需要的同学。捐赠的商品会显示在爱心页面，帮助更多同学。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: false
      };
    }
    
    if (lowerContent.includes('配送费用') || lowerContent.includes('配送费') || lowerContent.includes('运费')) {
      return {
        type: 'ai',
        content: '配送费用统一为2元/单，买卖双方各承担1元。\n\n配送费用于支付骑手的服务费用，确保配送服务的及时性和可靠性。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: false
      };
    }
    
    if (lowerContent.includes('首页') || lowerContent.includes('主页') || lowerContent.includes('回去')) {
      return {
        type: 'ai',
        content: '正在为你跳转到首页...',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: true,
        actionText: '去首页',
        action: 'navigateToIndex'
      };
    }
    
    if (lowerContent.includes('帮助') || lowerContent.includes('怎么用') || lowerContent.includes('不会用')) {
      return {
        type: 'ai',
        content: '我可以帮你：\n• 查看消息和通知\n• 查看订单\n• 发布盲盒\n• 浏览商品\n• 申请成为骑手\n• 进入个人中心\n\n直接告诉我你想做什么就好！',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: false
      };
    }
    
    if (lowerContent.includes('你好') || lowerContent.includes('嗨') || lowerContent.includes('hello') || lowerContent.includes('hi')) {
      return {
        type: 'ai',
        content: '你好！我是艾米，很高兴为你服务。今天有什么可以帮你的吗？',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: false
      };
    }
    
    if (lowerContent.includes('谢谢') || lowerContent.includes('感谢')) {
      return {
        type: 'ai',
        content: '不客气！有问题随时找我',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        showAction: false
      };
    }

    return {
      type: 'ai',
      content: '抱歉，我可能没理解你的问题。你可以问我：\n• "我有什么消息"\n• "查看我的订单"\n• "我要发布盲盒"\n• "我想买东西"\n• "怎么成为骑手"\n• "去我的个人中心"',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      showAction: false
    };
  },

  executeAction(action) {
    switch (action) {
      case 'navigateToMessage':
        wx.navigateTo({
          url: '../message/message',
          fail: () => {
            wx.showToast({ title: '跳转失败', icon: 'none' });
          }
        });
        break;
      case 'navigateToOrder':
        wx.navigateTo({
          url: '../order-list/order-list',
          fail: () => {
            wx.switchTab({ url: '../order-list/order-list' });
          }
        });
        break;
      case 'navigateToPublish':
        wx.switchTab({
          url: '../box-publish/box-publish',
          fail: () => {
            wx.navigateTo({ url: '../box-publish/box-publish' });
          }
        });
        break;
      case 'navigateToMarket':
        wx.switchTab({
          url: '../market/market',
          fail: () => {
            wx.navigateTo({ url: '../market/market' });
          }
        });
        break;
      case 'navigateToRider':
        wx.navigateTo({
          url: '../rider/rider',
          fail: () => {
            wx.showToast({ title: '页面跳转失败', icon: 'none' });
          }
        });
        break;
      case 'navigateToProfile':
        wx.switchTab({
          url: '../profile/profile',
          fail: () => {
            wx.navigateTo({ url: '../profile/profile' });
          }
        });
        break;
      case 'navigateToCommunity':
        wx.switchTab({
          url: '../community/community',
          fail: () => {
            wx.navigateTo({ url: '../community/community' });
          }
        });
        break;
      case 'navigateToIndex':
        wx.switchTab({
          url: '../index/index',
          fail: () => {
            wx.navigateBack({ delta: 1 });
          }
        });
        break;
      case 'getRecommendations':
        this.getRecommendations();
        break;
      case 'startPolish':
        this.startPolish();
        break;
    }
  },

  getRecommendations() {
    wx.showLoading({ title: '获取推荐中...' });
    wx.cloud.callFunction({
      name: 'aiService',
      data: {
        action: 'recommend',
        data: {
          preferences: {} // 可以根据用户历史行为添加偏好
        }
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.recommendations) {
        const recommendations = res.result.recommendations;
        let recommendationText = '根据你的兴趣，我为你推荐以下盲盒：\n\n';
        recommendations.forEach((item, index) => {
          recommendationText += `${index + 1}. ${item.title}\n   ${item.description}\n\n`;
        });
        
        const reply = {
          type: 'ai',
          content: recommendationText,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          showAction: true,
          actionText: '去逛逛',
          action: 'navigateToMarket'
        };
        
        this.setData({
          messages: [...this.data.messages, reply],
          pendingAction: reply.action
        });
        this.scrollToBottom();
      } else {
        wx.showToast({ title: '获取推荐失败', icon: 'none' });
      }
    }).catch(error => {
      wx.hideLoading();
      console.error('获取推荐失败', error);
      wx.showToast({ title: '服务暂时不可用', icon: 'none' });
    });
  },

  startPolish() {
    wx.showModal({
      title: 'AI润色',
      content: '请输入你想要润色的文本',
      editable: true,
      placeholderText: '输入需要润色的内容...',
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          wx.showLoading({ title: '润色中...' });
          wx.cloud.callFunction({
            name: 'aiService',
            data: {
              action: 'polish',
              data: {
                text: res.content.trim()
              }
            }
          }).then(res => {
            wx.hideLoading();
            if (res.result && res.result.result) {
              const reply = {
                type: 'ai',
                content: res.result.result,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                showAction: false
              };
              
              this.setData({
                messages: [...this.data.messages, reply]
              });
              this.scrollToBottom();
            } else {
              wx.showToast({ title: '润色失败', icon: 'none' });
            }
          }).catch(error => {
            wx.hideLoading();
            console.error('润色失败', error);
            wx.showToast({ title: '服务暂时不可用', icon: 'none' });
          });
        }
      }
    });
  },

  onMessageAction(e) {
    const index = e.currentTarget.dataset.index;
    const message = this.data.messages[index];
    if (message.action) {
      this.executeAction(message.action);
    }
  },

  scrollToBottom() {
    this.setData({
      scrollToView: 'msg-' + (this.data.messages.length - 1)
    });
  },

  quickQuestion(e) {
    const question = e.currentTarget.dataset.question;
    this.setData({ 
      inputValue: question,
      showQuickSection: false
    });
    this.sendMessage();
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({ url: '../index/index' });
      }
    });
  }
});