Page({
  data: {
    boxes: [],
    activeCategory: 'all',
    activeSort: 'default',
    loading: true,
    hasMore: true,
    page: 1
  },

  onShow() {
    this.loadBoxes();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, boxes: [] });
    this.loadBoxes();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  setCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category, page: 1, boxes: [] });
    this.loadBoxes();
  },

  setSort(e) {
    const sort = e.currentTarget.dataset.sort;
    this.setData({ activeSort: sort, page: 1, boxes: [] });
    this.loadBoxes();
  },

  loadBoxes() {
    this.setData({ loading: true });
    
    wx.cloud.callFunction({
      name: 'getBlindBoxes',
      data: {
        category: this.data.activeCategory,
        sort: this.data.activeSort,
        page: this.data.page
      },
      success: res => {
        const data = res.result;
        if (data && data.success && data.boxes && data.boxes.length > 0) {
          this.setData({
            boxes: this.data.page === 1 ? data.boxes : [...this.data.boxes, ...data.boxes],
            hasMore: data.boxes.length === 10,
            loading: false
          });
        } else {
          this.useMockData();
        }
        wx.stopPullDownRefresh();
      },
      fail: () => {
        this.useMockData();
        wx.stopPullDownRefresh();
      }
    });
  },

  useMockData() {
    const campusData = require('../../utils/campusData.js');
    const mockBoxes = campusData.getDemoHotBoxes();
    this.setData({
      boxes: mockBoxes,
      loading: false,
      hasMore: false
    });
  },

  loadMore() {
    this.setData({ loading: true, page: this.data.page + 1 });
    this.loadBoxes();
  },

  onSearchChange(e) {
    this.setData({ keyword: e.detail.value });
  },

  searchBoxes() {
    if (!this.data.keyword) {
      return;
    }
    this.setData({ page: 1, boxes: [] });
    this.loadBoxes();
  },

  navigateToBoxDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `../box-detail/box-detail?id=${id}` });
  }
});