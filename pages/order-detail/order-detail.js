// 订单详情页面

Page({
  data: {
    id: '',
    order: null,
    loading: false,
    updating: false,
    markers: [],
    polyline: [],
    orderWatcher: null
  },

  onLoad(options) {
    console.log('订单详情页面加载:', options);
    this.setData({ id: options.id });
    this.loadDetail();
    this.watchOrder();
  },

  onUnload() {
    if (this.data.orderWatcher) {
      this.data.orderWatcher.close();
    }
  },

  watchOrder() {
    const db = wx.cloud.database();
    const watcher = db.collection('orders').doc(this.data.id).watch({
      onChange: (snapshot) => {
        console.log('订单实时更新:', snapshot);
        if (snapshot.docs.length > 0) {
          this.setData({ order: snapshot.docs[0] });
        }
      },
      onError: (err) => {
        console.error('订单监听失败:', err);
      }
    });
    this.setData({ orderWatcher: watcher });
  },

  loadDetail() {
    console.log('加载订单详情');
    this.setData({ loading: true });

    // 调用云函数获取订单详情
    wx.cloud.callFunction({
      name: 'getOrderDetail',
      data: {
        id: this.data.id
      }
    })
      .then(res => {
        console.log('云函数调用结果:', res);
      
        if (res.result.success) {
          const { order, logisticsTimeline } = res.result.data;
        
          // 生成地图标记和路线数据
          const fromLocation = { latitude: 39.910000, longitude: 116.395000 };
          const toLocation = { latitude: 39.908000, longitude: 116.400000 };
          const riderLocation = { 
            latitude: order.rider?.latitude || 39.90923, 
            longitude: order.rider?.longitude || 116.397428 
          };

          const markers = [
            {
              id: 1,
              latitude: fromLocation.latitude,
              longitude: fromLocation.longitude,
              iconPath: '/images/location-start.png',
              width: 30,
              height: 30,
              title: order.fromDorm || '中园公寓',
              callout: {
                content: order.fromDorm || '中园公寓',
                color: '#ffffff',
                fontSize: 14,
                borderRadius: 4,
                bgColor: 'rgba(124, 58, 237, 0.9)',
                display: 'ALWAYS'
              }
            },
            {
              id: 2,
              latitude: toLocation.latitude,
              longitude: toLocation.longitude,
              iconPath: '/images/location-end.png',
              width: 30,
              height: 30,
              title: order.toDorm || '苏园居',
              callout: {
                content: order.toDorm || '苏园居',
                color: '#ffffff',
                fontSize: 14,
                borderRadius: 4,
                bgColor: 'rgba(34, 197, 94, 0.9)',
                display: 'ALWAYS'
              }
            },
            {
              id: 3,
              latitude: riderLocation.latitude,
              longitude: riderLocation.longitude,
              iconPath: '/images/rider.png',
              width: 40,
              height: 40,
              title: order.rider?.name || '骑手',
              rotate: 45,
              callout: {
                content: (order.rider?.name || '骑手') + '\n距离 ' + (order.distance || '200') + ' 米',
                color: '#ffffff',
                fontSize: 14,
                borderRadius: 4,
                bgColor: 'rgba(124, 58, 237, 0.9)',
                display: 'ALWAYS'
              }
            }
          ];

          const polyline = [
            {
              points: [fromLocation, riderLocation, toLocation],
              color: '#7c3aed',
              width: 4,
              dottedLine: false
            }
          ];

          this.setData({
            order: order,
            logisticsTimeline: logisticsTimeline,
            markers: markers,
            polyline: polyline,
            loading: false
          });
        } else {
          console.error('获取订单详情失败:', res.result.message);
          wx.showToast({
            title: res.result.message || '获取订单详情失败',
            icon: 'none',
            duration: 1500
          });
          this.setData({ loading: false });
        }
      })
      .catch(err => {
        console.error('云函数调用失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
          duration: 1500
        });
        this.setData({ loading: false });
      
        // 失败时使用模拟数据
        this.loadMockData();
      });
  },

  // 加载模拟数据（备用）
  loadMockData() {
    console.log('加载模拟数据');
    
    // 模拟物流时间轴数据
    const logisticsTimeline = [
      {
        status: '骑手已取货',
        desc: '骑手李师傅已取到您的盲盒，正在配送中',
        time: '14:32'
      },
      {
        status: '骑手到达取货点',
        desc: '骑手已到达中园公寓取货地点',
        time: '14:25'
      },
      {
        status: '骑手接单',
        desc: '骑手李师傅已接单，预计15分钟送达',
        time: '14:20'
      },
      {
        status: '订单分配骑手',
        desc: '系统已为您分配骑手',
        time: '14:18'
      },
      {
        status: '订单创建成功',
        desc: '您的盲盒订单已创建，等待骑手接单',
        time: '14:15'
      }
    ];

    // 模拟数据
    const now = new Date();
    const mockOrder = {
      _id: this.data.id || '123456',
      boxInfo: {
        title: '精美文具套装盲盒',
        images: ['/images/blindbox/electronics_0_0.jpg'],
        desc: '包含笔、本子、尺子等精美文具，超值盲盒！'
      },
      price: 14.9,
      status: 'delivering',
      createdAt: new Date().toISOString(),
      formattedTime: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      contact: {
        name: '张三',
        phone: '13800138000'
      },
      address: '苏园居3层',
      fromDorm: '中园公寓',
      toDorm: '苏园居',
      distance: 200,
      estimatedArrival: '15分钟内',
      remainingTime: 12,
      paymentMethod: 'offline',
      rider: {
        name: '李师傅',
        avatar: '/images/blindbox/fashion_0_0.jpg',
        phone: '13900139000',
        rating: 4.8,
        completedOrders: 128,
        latitude: 39.90923,
        longitude: 116.397428
      }
    };

    // 生成地图标记和路线数据
    const fromLocation = { latitude: 39.910000, longitude: 116.395000 };
    const toLocation = { latitude: 39.908000, longitude: 116.400000 };
    const riderLocation = { latitude: mockOrder.rider.latitude, longitude: mockOrder.rider.longitude };

    const markers = [
      {
        id: 1,
        latitude: fromLocation.latitude,
        longitude: fromLocation.longitude,
        iconPath: '/images/location-start.png',
        width: 30,
        height: 30,
        title: mockOrder.fromDorm,
        callout: {
          content: mockOrder.fromDorm,
          color: '#ffffff',
          fontSize: 14,
          borderRadius: 4,
          bgColor: 'rgba(124, 58, 237, 0.9)',
          display: 'ALWAYS'
        }
      },
      {
        id: 2,
        latitude: toLocation.latitude,
        longitude: toLocation.longitude,
        iconPath: '/images/location-end.png',
        width: 30,
        height: 30,
        title: mockOrder.toDorm,
        callout: {
          content: mockOrder.toDorm,
          color: '#ffffff',
          fontSize: 14,
          borderRadius: 4,
          bgColor: 'rgba(34, 197, 94, 0.9)',
          display: 'ALWAYS'
        }
      },
      {
        id: 3,
        latitude: riderLocation.latitude,
        longitude: riderLocation.longitude,
        iconPath: '/images/rider.png',
        width: 40,
        height: 40,
        title: mockOrder.rider.name,
        rotate: 45,
        callout: {
          content: mockOrder.rider.name + '\n距离 ' + (mockOrder.distance || '200') + ' 米',
          color: '#ffffff',
          fontSize: 14,
          borderRadius: 4,
          bgColor: 'rgba(124, 58, 237, 0.9)',
          display: 'ALWAYS'
        }
      }
    ];

    const polyline = [
      {
        points: [fromLocation, riderLocation, toLocation],
        color: '#7c3aed',
        width: 4,
        dottedLine: false
      }
    ];

    this.setData({
      order: mockOrder,
      logisticsTimeline: logisticsTimeline,
      markers: markers,
      polyline: polyline,
      loading: false
    });
  },

  // 返回上一页
  goBack() {
    console.log('返回上一页');
    wx.navigateBack({
      delta: 1,
      success: function (res) {
        console.log('返回成功');
      },
      fail: function (err) {
        console.error('返回失败:', err);
      }
    });
  },

  // 拨打电话
  makeCall(e) {
    const phone = e.currentTarget.dataset.phone;
    console.log('拨打电话:', phone);
    wx.makePhoneCall({
      phoneNumber: phone,
      success: function (res) {
        console.log('拨打电话成功');
      },
      fail: function (err) {
        console.error('拨打电话失败:', err);
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 联系骑手
  callRider(e) {
    const phone = e.currentTarget.dataset.phone;
    console.log('联系骑手:', phone);
    wx.makePhoneCall({
      phoneNumber: phone,
      success: function (res) {
        console.log('联系骑手成功');
      },
      fail: function (err) {
        console.error('联系骑手失败:', err);
        wx.showToast({
          title: '联系骑手失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 联系卖家
  contactSeller() {
    console.log('联系卖家');
    wx.showModal({
      title: '联系卖家',
      content: '是否通过微信联系卖家？',
      confirmText: '联系',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '正在跳转微信...',
            icon: 'none',
            duration: 1500
          });
          // 这里可以添加跳转微信的逻辑
        }
      }
    });
  },

  // 更新订单状态
  updateOrderStatus(e) {
    const status = e.currentTarget.dataset.status;
    console.log('更新订单状态:', status);
    
    this.setData({ updating: true });
    
    // 模拟更新状态
    setTimeout(() => {
      const order = { ...this.data.order, status: status };
      this.setData({ 
        order: order,
        updating: false 
      });
      
      wx.showToast({
        title: status === 'delivering' ? '开始配送成功' : '订单已完成',
        icon: 'success',
        duration: 1500
      });
    }, 1000);
  },

  // 再次购买
  buyAgain() {
    console.log('再次购买');
    wx.navigateTo({
      url: '../box-detail/box-detail?id=1',
      success: function (res) {
        console.log('跳转到商品详情页面成功');
      },
      fail: function (err) {
        console.error('跳转到商品详情页面失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 复制地址
  copyAddress(e) {
    const address = e.currentTarget.dataset.address;
    console.log('复制地址:', address);
    wx.setClipboardData({
      data: address,
      success: function () {
        wx.showToast({
          title: '地址已复制',
          icon: 'success',
          duration: 1500
        });
      },
      fail: function (err) {
        console.error('复制地址失败:', err);
        wx.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.loadDetail();
    wx.stopPullDownRefresh();
  },

  onShareAppMessage() {
    return {
      title: '订单详情 - 校园盲盒',
      path: `/pages/order-detail/order-detail?id=${this.data.id}`
    };
  },

  // 图片加载完成事件
  onImageLoad(e) {
    console.log('图片加载完成:', e);
    // 可以在这里添加图片加载完成后的处理逻辑
    // 例如添加加载动画、更新图片状态等
  }
});
