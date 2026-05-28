const ui = require('../../utils/ui.js')

Page({
  data: {
    tab: 'pending',
    pendingOrders: [],
    riderOrders: [],
    loading: false,
    page: 1,
    limit: 10,
    finished: false,
    grabbing: false,
    updating: false,
    isOnline: false,
    locationUpdateTimer: null,
    riderStats: {
      todayOrders: 0,
      todayEarnings: 0
    }
  },

  // 时间格式化函数
  formatTime(timestamp) {
    if (!timestamp) return '未知时间';
    const date = new Date(timestamp);
    
    // 格式化日期为年月日时分格式
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  },

  onLoad() {
    this.loadOrders();
    this.loadRiderStats();
  },

  onShow() {
    if (this.data.isOnline) {
      this.startLocationUpdate()
    }
  },

  onHide() {
    this.stopLocationUpdate()
  },

  onUnload() {
    this.stopLocationUpdate()
  },

  onPullDownRefresh() {
    this.loadOrders(true);
  },

  onReachBottom() {
    if (!this.data.finished) {
      this.loadOrders(false);
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.tab) return;
    this.setData({ 
      tab, 
      page: 1, 
      finished: false 
    }, () => this.loadOrders(true));
  },

  loadOrders(reset) {
    if (this.data.loading) return;
    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });
    
    // 模拟数据
    if (this.data.tab === 'pending') {
      const now = new Date();
      const mockPendingOrders = [
        {
          _id: '1',
          boxInfo: {
            title: '全新数码配件盲盒',
            images: ['https://res.wx.qq.com/wxdoc/dist/assets/img/demo.ef5c5bef.jpg']
          },
          price: 9.9,
          createdAt: new Date().toISOString(),
          formattedTime: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          address: '东区1栋',
          contact: {
            name: '张三',
            phone: '13800138000'
          }
        },
        {
          _id: '2',
          boxInfo: {
            title: '精美文具套装',
            images: ['https://res.wx.qq.com/wxdoc/dist/assets/img/demo.ef5c5bef.jpg']
          },
          price: 14.9,
          createdAt: new Date().toISOString(),
          formattedTime: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          address: '西区3栋',
          contact: {
            name: '李四',
            phone: '13900139000'
          }
        }
      ];
      
      setTimeout(() => {
        this.setData({
          pendingOrders: mockPendingOrders,
          page,
          finished: true,
          loading: false
        });
        wx.stopPullDownRefresh();
      }, 500);
    } else {
      const now = new Date();
      const mockRiderOrders = [
        {
          _id: '1',
          order: {
            boxInfo: {
              title: '全新数码配件盲盒',
              images: ['https://res.wx.qq.com/wxdoc/dist/assets/img/demo.ef5c5bef.jpg']
            },
            price: 9.9,
            createdAt: new Date().toISOString(),
            formattedTime: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
            address: '东区1栋',
            contact: {
              name: '张三',
              phone: '13800138000'
            }
          },
          status: 'pending'
        },
        {
          _id: '2',
          order: {
            boxInfo: {
              title: '精美文具套装',
              images: ['https://res.wx.qq.com/wxdoc/dist/assets/img/demo.ef5c5bef.jpg']
            },
            price: 14.9,
            createdAt: new Date().toISOString(),
            formattedTime: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
            address: '西区3栋',
            contact: {
              name: '李四',
              phone: '13900139000'
            }
          },
          status: 'delivering'
        }
      ];
      
      setTimeout(() => {
        this.setData({
          riderOrders: mockRiderOrders,
          page,
          finished: true,
          loading: false
        });
        wx.stopPullDownRefresh();
      }, 500);
    }
  },

  grabOrder(e) {
    const orderId = e.currentTarget.dataset.orderId;
    this.setData({ grabbing: true });
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      this.setData({ grabbing: false });
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.cloud.callFunction({
      name: 'deliveryService',
      data: {
        action: 'grab',
        data: {
          orderId,
          riderOpenid: userInfo.openid,
          riderInfo: {
            name: userInfo.nickName,
            avatar: userInfo.avatarUrl
          }
        }
      }
    }).then(res => {
      if (res.result.success) {
        wx.showToast({ title: '抢单成功', icon: 'success' });
        this.loadOrders(true);
      } else {
        wx.showToast({ title: '抢单失败', icon: 'none' });
      }
    }).catch(err => {
      console.error(err);
      wx.showToast({ title: '抢单失败', icon: 'none' });
    }).finally(() => {
      this.setData({ grabbing: false });
    });
  },

  updateDeliveryStatus(e) {
    const deliveryId = e.currentTarget.dataset.deliveryId;
    const status = e.currentTarget.dataset.status;
    this.setData({ updating: true });
    wx.cloud.callFunction({
      name: 'deliveryService',
      data: {
        action: 'updateStatus',
        data: {
          deliveryId,
          status
        }
      }
    }).then(res => {
      if (res.result.success) {
        ui.loadingStates.showSuccess('状态更新成功');
        this.loadOrders(true);
      } else {
        ui.loadingStates.showError('状态更新失败');
      }
    }).catch(err => {
      console.error(err);
      ui.loadingStates.showError('状态更新失败');
    }).finally(() => {
      this.setData({ updating: false });
    });
  },

  // 切换在线状态
  async toggleOnline() {
    const newStatus = !this.data.isOnline
    
    if (newStatus) {
      const hasPermission = await this.checkLocationPermission()
      if (!hasPermission) {
        ui.loadingStates.showToast('请先开启位置权限', 'none')
        return
      }
    }

    this.setData({ isOnline: newStatus })
    
    if (newStatus) {
      ui.loadingStates.showSuccess('已上线')
      this.startLocationUpdate()
    } else {
      ui.loadingStates.showToast('已下线', 'none')
      this.stopLocationUpdate()
    }

    await wx.cloud.callFunction({
      name: 'deliveryService',
      data: {
        action: 'setOnlineStatus',
        data: { isOnline: newStatus }
      }
    })
  },

  // 检查位置权限
  checkLocationPermission() {
    return new Promise((resolve) => {
      wx.getSetting({
        success: (res) => {
          const hasLocation = res.authSetting['scope.userLocation']
          if (hasLocation) {
            resolve(true)
          } else {
            wx.authorize({
              scope: 'scope.userLocation',
              success: () => resolve(true),
              fail: () => resolve(false)
            })
          }
        },
        fail: () => resolve(false)
      })
    })
  },

  // 开始位置更新
  startLocationUpdate() {
    if (this.data.locationUpdateTimer) return

    this.updateLocation()
    
    this.data.locationUpdateTimer = setInterval(() => {
      this.updateLocation()
    }, 30000)
  },

  // 停止位置更新
  stopLocationUpdate() {
    if (this.data.locationUpdateTimer) {
      clearInterval(this.data.locationUpdateTimer)
      this.data.locationUpdateTimer = null
    }
  },

  // 更新位置
  async updateLocation() {
    try {
      const location = await this.getLocation()
      await wx.cloud.callFunction({
        name: 'deliveryService',
        data: {
          action: 'updateLocation',
          data: { location }
        }
      })
    } catch (error) {
      console.error('更新位置失败:', error)
    }
  },

  // 获取位置
  getLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: resolve,
        fail: reject
      })
    })
  },

  // 加载骑手统计
  async loadRiderStats() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'deliveryService',
        data: { action: 'getTodayStats' }
      })
      if (result?.result?.success) {
        this.setData({ riderStats: result.result.data })
      } else {
        this.setData({ riderStats: { todayOrders: 3, todayEarnings: 27 } })
      }
    } catch (error) {
      console.error('加载统计失败:', error)
      this.setData({ riderStats: { todayOrders: 3, todayEarnings: 27 } })
    }
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.orderId
    wx.navigateTo({ url: `./order-detail/order-detail?id=${orderId}` })
  },

  // 查看统计面板
  viewStats() {
    wx.navigateTo({ url: './stats/stats' })
  },

  // 导航到取货地点
  navigateToPickup(e) {
    const address = e.currentTarget.dataset.address
    ui.loadingStates.showToast('正在打开地图...', 'none')
    
    wx.chooseLocation({
      success: (res) => {
        wx.openLocation({
          latitude: res.latitude,
          longitude: res.longitude,
          name: address,
          address: address,
          scale: 18
        })
      }
    })
  }
});