const { boxes, searchBoxes } = require('../../data/mock-data.js');

Page({
  data: {
    keyword: '',
    hasSearched: false,
    historyList: [],
    hotKeywords: ['盲盒', '零食', '文具', '书籍', '日用品', '服饰'],
    activeTab: 'all',
    results: [],
    users: [],
    loading: false
  },

  onLoad() {
    this.loadHistory();
  },

  loadHistory() {
    const history = wx.getStorageSync('searchHistory') || [];
    this.setData({ historyList: history });
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  clearKeyword() {
    this.setData({ keyword: '', hasSearched: false, results: [], users: [] });
  },

  doSearch() {
    if (!this.data.keyword.trim()) {
      return;
    }
    
    this.setData({ hasSearched: true, loading: true });
    
    this.saveHistory(this.data.keyword);
    
    wx.cloud.callFunction({
      name: 'searchItems',
      data: { keyword: this.data.keyword },
      success: res => {
        if (res.result) {
          this.setData({ results: res.result.boxes || [], users: res.result.users || [], loading: false });
        } else {
          this.useMockData();
        }
      },
      fail: () => {
        this.useMockData();
      }
    });
  },

  useMockData() {
    this.setData({
      results: [
        { _id: '1', type: 'box', title: '盲盒', images: ['https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png'], school: '北京大学', typeName: '盲盒', price: 9.9 },
        { _id: '2', type: 'product', title: '零食大礼包', images: ['https://img.zcool.cn/community/013c7a57e4a6fa0000018c1b8d3e4f.png@1280w_1l_2o_100sh.png'], school: '清华大学', typeName: '零食', price: 15.0 }
      ],
      users: [
        { _id: '1', nickName: '小明', avatar: 'https://img.zcool.cn/community/01c7a57e4a6fa0000018c1b6e8f91a.jpg@1280w_1l_2o_100sh.jpg', school: '北京大学' }
      ],
      loading: false
    });
  },

  saveHistory(keyword) {
    let history = this.data.historyList.filter(item => item !== keyword);
    history.unshift(keyword);
    history = history.slice(0, 10);
    this.setData({ historyList: history });
    wx.setStorageSync('searchHistory', history);
  },

  searchHistory(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.doSearch();
  },

  clearHistory() {
    wx.removeStorageSync('searchHistory');
    this.setData({ historyList: [] });
  },

  setTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  goBack() {
    wx.navigateBack();
  },

  navigateToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `../box-detail/box-detail?id=${id}` });
  },

  navigateToUser(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '用户详情功能暂未开放', icon: 'none' });
  }
});