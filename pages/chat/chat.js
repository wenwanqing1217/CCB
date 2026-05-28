// 聊天页面
Page({
  data: {
    targetUser: null,
    messages: [],
    inputValue: '',
    scrollToMessage: '',
    loading: false
  },

  onLoad(options) {
    // 获取目标用户信息
    const targetUser = {
      id: options.userId || '1',
      name: options.userName || '用户',
      avatar: options.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
    }
    this.setData({ targetUser })
    
    // 加载聊天记录
    this.loadMessages()
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: targetUser.name
    })
  },

  onShow() {
    // 开始轮询新消息
    this.startMessagePolling()
  },

  onHide() {
    // 停止轮询
    this.stopMessagePolling()
  },

  onUnload() {
    // 停止轮询
    this.stopMessagePolling()
  },

  // 加载聊天记录
  loadMessages() {
    // 模拟加载聊天记录
    const mockMessages = [
      {
        _id: '1',
        type: 'receive',
        content: '你好，对你的盲盒很感兴趣！',
        time: '10:30',
        avatar: this.data.targetUser.avatar
      },
      {
        _id: '2',
        type: 'send',
        content: '谢谢关注，请问有什么想了解的吗？',
        time: '10:32',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
      }
    ]
    
    this.setData({
      messages: mockMessages
    }, () => {
      this.scrollToBottom()
    })
  },

  // 开始消息轮询
  startMessagePolling() {
    this.messageTimer = setInterval(() => {
      this.checkNewMessages()
    }, 3000)
  },

  // 停止消息轮询
  stopMessagePolling() {
    if (this.messageTimer) {
      clearInterval(this.messageTimer)
      this.messageTimer = null
    }
  },

  // 检查新消息
  checkNewMessages() {
    // 模拟接收新消息
    if (Math.random() > 0.9) {
      const newMessage = {
        _id: Date.now().toString(),
        type: 'receive',
        content: '这个盲盒还在吗？',
        time: this.formatTime(new Date()),
        avatar: this.data.targetUser.avatar
      }
      
      const messages = this.data.messages.concat(newMessage)
      this.setData({ messages }, () => {
        this.scrollToBottom()
      })
    }
  },

  // 输入框变化
  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  // 发送消息
  sendMessage() {
    const content = this.data.inputValue.trim()
    if (!content) return
    
    const newMessage = {
      _id: Date.now().toString(),
      type: 'send',
      content: content,
      time: this.formatTime(new Date()),
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    }
    
    const messages = this.data.messages.concat(newMessage)
    this.setData({
      messages,
      inputValue: ''
    }, () => {
      this.scrollToBottom()
    })
    
    // 模拟对方回复
    setTimeout(() => {
      this.simulateReply()
    }, 1000 + Math.random() * 2000)
  },

  // 模拟回复
  simulateReply() {
    const replies = [
      '好的，我明白了',
      '可以啊，什么时候方便交易？',
      '这个价格可以吗？',
      '谢谢你的咨询！',
      '我还在考虑中',
      '可以拍个实物图看看吗？'
    ]
    
    const replyMessage = {
      _id: Date.now().toString(),
      type: 'receive',
      content: replies[Math.floor(Math.random() * replies.length)],
      time: this.formatTime(new Date()),
      avatar: this.data.targetUser.avatar
    }
    
    const messages = this.data.messages.concat(replyMessage)
    this.setData({ messages }, () => {
      this.scrollToBottom()
    })
  },

  // 滚动到底部
  scrollToBottom() {
    const messages = this.data.messages
    if (messages.length > 0) {
      this.setData({
        scrollToMessage: messages[messages.length - 1]._id
      })
    }
  },

  // 格式化时间
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  },

  // 查看用户资料
  viewUserProfile() {
    wx.navigateTo({
      url: `/pages/user-profile/user-profile?userId=${this.data.targetUser.id}`
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 显示更多选项
  showMore() {
    wx.showActionSheet({
      itemList: ['查看资料', '清空聊天记录', '举报'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.viewUserProfile()
            break
          case 1:
            wx.showModal({
              title: '提示',
              content: '确定要清空聊天记录吗？',
              success: (res) => {
                if (res.confirm) {
                  this.setData({ messages: [] })
                }
              }
            })
            break
          case 2:
            wx.showToast({
              title: '举报功能开发中',
              icon: 'none'
            })
            break
        }
      }
    })
  }
})
