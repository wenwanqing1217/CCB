Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页"
      },
      {
        pagePath: "/pages/love/love",
        text: "盲盒"
      },
      {
        pagePath: "/pages/box-publish/box-publish",
        text: "发布"
      },
      {
        pagePath: "/pages/message/message",
        text: "消息"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
      this.setData({
        selected: data.index
      });
    }
  }
});
