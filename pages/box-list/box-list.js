// 模拟数据 - 使用合适的商品占位图
const mockBoxes = [
  {
    _id: '2',
    title: '精美文具套装盲盒',
    price: 14.9,
    desc: '笔、本子、尺子、橡皮等文具',
    type: 'stationery',
    mode: 'light',
    campus: '中园公寓',
    building: '3层',
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    images: ['/images/blindbox/electronics_0_0.jpg'],
    sales: 86,
    likes: 32,
    comments: 8
  },
  {
    _id: '3',
    title: '时尚服饰盲盒',
    price: 19.9,
    desc: 'T恤、袜子、帽子等服饰',
    type: 'clothing',
    mode: 'dark',
    campus: '中南公寓',
    building: '2层',
    createdAt: Date.now() - 10 * 60 * 60 * 1000,
    images: ['/images/blindbox/fashion_0_0.jpg'],
    sales: 56,
    likes: 28,
    comments: 5
  },
  {
    _id: '4',
    title: '图书盲盒',
    price: 12.9,
    desc: '小说、教材、课外书等',
    type: 'book',
    mode: 'light',
    campus: '新柏居',
    building: '5层',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    images: ['/images/blindbox/fashion_1_1.jpg'],
    sales: 42,
    likes: 18,
    comments: 3
  },
  {
    _id: '5',
    title: '零食大礼包盲盒',
    price: 29.9,
    desc: '各种零食随机组合',
    type: 'snack',
    mode: 'dark',
    campus: '清水居',
    building: '4层',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    images: ['/images/blindbox/study_0_0.jpg'],
    sales: 156,
    likes: 68,
    comments: 22
  },
  {
    _id: '6',
    title: '数码配件盲盒',
    price: 25.9,
    desc: '手机壳、数据线、耳机等',
    type: 'digital',
    mode: 'light',
    campus: '三友园',
    building: '3层',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    images: ['/images/blindbox/study_1_1.jpg'],
    sales: 78,
    likes: 41,
    comments: 15
  },
  {
    _id: '7',
    title: '二手生活用品盲盒',
    price: 9.9,
    desc: '八成新闲置生活用品随机装',
    type: 'secondhand',
    mode: 'light',
    campus: '四季园',
    building: '1层',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    images: ['/images/blindbox/sports_0_0.jpg'],
    sales: 52,
    likes: 23,
    comments: 7
  },
  {
    _id: '8',
    title: '原创手作盲盒',
    price: 39.9,
    desc: '手工制作的精美小物件',
    type: 'original',
    mode: 'dark',
    campus: '松柏居',
    building: '2层',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    images: ['/images/blindbox/sports_1_1.jpg'],
    sales: 35,
    likes: 48,
    comments: 12
  }
];

Page({
  data: {
    list: [],
    loading: false,
    page: 1,
    limit: 10,
    finished: false,
    searchKeyword: '',
    filters: {
      type: '',
      campus: ''
    },
    typeLabels: ['全部类型', '文具盲盒', '服饰盲盒', '图书盲盒', '零食盲盒', '数码盲盒', '二手盲盒', '原创盲盒'],
    typeValues: ['', 'stationery', 'clothing', 'book', 'snack', 'digital', 'secondhand', 'original'],
    typeIndex: 0,
    campusLabels: ['全部楼栋', '中园公寓', '中南公寓', '新柏居', '清水居', '三友园', '四季园', '松柏居'],
    campusValues: ['', '中园公寓', '中南公寓', '新柏居', '清水居', '三友园', '四季园', '松柏居'],
    campusIndex: 0
  },

  onLoad() {
    this.loadList(true);
  },

  onPullDownRefresh() {
    this.loadList(true);
  },

  onReachBottom() {
    if (!this.data.finished) {
      this.loadList(false);
    }
  },

  loadList(reset) {
    if (this.data.loading) {
      return;
    }
    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });
    
    // 模拟网络请求
    setTimeout(() => {
      const filteredBoxes = this.filterBoxes(mockBoxes);
      const startIndex = (page - 1) * this.data.limit;
      const endIndex = startIndex + this.data.limit;
      const data = filteredBoxes.slice(startIndex, endIndex);
      
      this.setData({
        list: reset ? data : this.data.list.concat(data),
        page,
        finished: endIndex >= filteredBoxes.length,
        loading: false
      });
      
      wx.stopPullDownRefresh();
    }, 800);
  },

  filterBoxes(boxes) {
    const { type, campus } = this.data.filters;
    const { searchKeyword } = this.data;
    return boxes.filter(box => {
      if (type && box.type !== type) {
        return false;
      }
      if (campus && box.campus !== campus) {
        return false;
      }
      if (searchKeyword && !box.title.includes(searchKeyword) && !box.desc.includes(searchKeyword)) {
        return false;
      }
      return true;
    }).map(box => ({
      ...box,
      typeLabel: this.getTypeLabel(box.type)
    }));
  },

  getTypeLabel(type) {
    const typeMap = {
      'stationery': '文具盲盒',
      'clothing': '服饰盲盒',
      'book': '图书盲盒',
      'snack': '零食盲盒',
      'digital': '数码盲盒',
      'secondhand': '二手盲盒',
      'original': '原创盲盒'
    };
    return typeMap[type] || '盲盒';
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm(e) {
    const keyword = e.detail.value.trim();
    this.setData({
      searchKeyword: keyword,
      page: 1,
      finished: false
    });
    this.loadList(true);
  },

  cancelSearch() {
    this.setData({
      searchKeyword: '',
      page: 1,
      finished: false
    });
    this.loadList(true);
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/box-detail/box-detail?id=${id}`
    });
  },

  bindTypeChange(e) {
    const index = parseInt(e.detail.value);
    const type = this.data.typeValues[index];
    this.setData({
      typeIndex: index,
      'filters.type': type,
      page: 1,
      finished: false
    });
    this.loadList(true);
  },

  bindCampusChange(e) {
    const index = parseInt(e.detail.value);
    const campus = this.data.campusValues[index];
    this.setData({
      campusIndex: index,
      'filters.campus': campus,
      page: 1,
      finished: false
    });
    this.loadList(true);
  },

  goPublish() {
    wx.switchTab({
      url: '/pages/box-publish/box-publish'
    });
  }
});
