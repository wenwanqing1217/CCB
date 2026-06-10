/**
 * 虚拟滚动列表组件
 * 只渲染可视区域内的列表项，提升长列表性能
 */

const { compatibility } = require('../../utils/index.js');

Component({
  properties: {
    data: {
      type: Array,
      value: [],
      observer: 'onDataChange'
    },
    itemHeight: {
      type: Number,
      value: 200
    },
    itemTemplate: {
      type: String,
      value: ''
    },
    containerHeight: {
      type: Number,
      value: 0
    },
    showScrollbar: {
      type: Boolean,
      value: true
    }
  },

  data: {
    visibleData: [],
    startIndex: 0,
    endIndex: 0,
    scrollTop: 0,
    totalHeight: 0,
    visibleCount: 10,
    bufferCount: 3,
    windowHeight: 667
  },

  lifetimes: {
    attached() {
      this.initWindowHeight();
    }
  },

  methods: {
    async initWindowHeight() {
      try {
        const windowInfo = await compatibility.getWindowInfo();
        this.setData({
          windowHeight: windowInfo.windowHeight || 667,
          visibleCount: Math.ceil((windowInfo.windowHeight || 667) / this.properties.itemHeight) + 2
        });
        this.updateVisibleData();
      } catch (err) {
        console.error('获取窗口信息失败:', err);
      }
    },

    onDataChange() {
      this.setData({
        totalHeight: this.properties.data.length * this.properties.itemHeight
      });
      this.updateVisibleData();
    },

    updateVisibleData(scrollTop) {
      const { itemHeight, data } = this.properties;
      const effectiveScrollTop = typeof scrollTop === 'number' ? scrollTop : this.data.scrollTop;
      const { visibleCount, bufferCount } = this.data;
      
      const startIndex = Math.max(0, Math.floor(effectiveScrollTop / itemHeight) - bufferCount);
      const endIndex = Math.min(
        data.length - 1,
        startIndex + visibleCount + bufferCount * 2
      );
      
      const visibleData = data.slice(startIndex, endIndex + 1).map((item, index) => ({
        ...item,
        __virtualIndex: startIndex + index
      }));
      
      // Batch update: setData once
      this.setData({
        visibleData,
        startIndex,
        endIndex,
        scrollTop: effectiveScrollTop
      });
    },

    // Batch scroll updates to avoid multiple setData per frame
    onScroll(e) {
      const scrollTop = e.detail.scrollTop;
      this._pendingScrollTop = scrollTop;
      if (!this._pendingFlushScheduled) {
        this._pendingFlushScheduled = true;
        // schedule next frame (~16ms)
        setTimeout(() => {
          this._pendingFlushScheduled = false;
          this.updateVisibleData(this._pendingScrollTop);
          this.triggerEvent('scroll', { scrollTop: this._pendingScrollTop });
        }, 16);
      }
    },

    onScrollToLower() {
      this.triggerEvent('scrolltolower');
    },

    onScrollToUpper() {
      this.triggerEvent('scrolltoupper');
    },

    scrollToIndex(index, options = {}) {
      const scrollTop = index * this.properties.itemHeight;
      this.setData({ scrollTop });
      
      if (options.animated !== false) {
        const query = this.createSelectorQuery();
        query.select('.virtual-list-container').boundingClientRect((rect) => {
          if (rect) {
            wx.pageScrollTo({
              scrollTop: scrollTop - rect.top,
              duration: options.duration || 300
            });
          }
        }).exec();
      }
      
      this.triggerEvent('scrolltoindex', { index });
    },

    getItemIndex(e) {
      const dataset = e.currentTarget?.dataset || e.target?.dataset || {};
      return dataset.index !== undefined ? dataset.index : null;
    },

    handleItemTap(e) {
      const index = this.getItemIndex(e);
      if (index !== null) {
        this.triggerEvent('itemtap', { 
          index, 
          item: this.properties.data[index],
          event: e 
        });
      }
    },

    handleItemLongPress(e) {
      const index = this.getItemIndex(e);
      if (index !== null) {
        this.triggerEvent('itemlongpress', { 
          index, 
          item: this.properties.data[index],
          event: e 
        });
      }
    }
  }
});
