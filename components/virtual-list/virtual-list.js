Component({
  properties: {
    data: {
      type: Array,
      value: [],
      observer: function () {
        this.updateList();
      }
    },
    itemHeight: {
      type: Number,
      value: 200
    },
    bufferSize: {
      type: Number,
      value: 3
    }
  },

  data: {
    visibleData: [],
    startIndex: 0,
    endIndex: 0,
    containerHeight: 0,
    totalHeight: 0
  },

  lifetimes: {
    attached: function () {
      this.getContainerHeight();
    }
  },

  methods: {
    getContainerHeight: function () {
      const sysInfo = wx.getSystemInfoSync();
      const containerHeight = sysInfo.windowHeight - 200;
      this.setData({ containerHeight });
      this.updateList();
    },

    updateList: function () {
      const { data, itemHeight, containerHeight, bufferSize } = this.properties;
      const totalHeight = data.length * itemHeight;
      const visibleCount = Math.ceil(containerHeight / itemHeight) + bufferSize * 2;
      
      this.setData({
        totalHeight,
        endIndex: Math.min(visibleCount, data.length),
        visibleData: data.slice(0, Math.min(visibleCount, data.length))
      });
    },

    onScroll: function (e) {
      const { scrollTop } = e.detail;
      const { itemHeight, bufferSize, data } = this.properties;
      
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
      const visibleCount = Math.ceil(this.data.containerHeight / itemHeight) + bufferSize * 2;
      const endIndex = Math.min(startIndex + visibleCount, data.length);

      if (startIndex !== this.data.startIndex || endIndex !== this.data.endIndex) {
        const visibleData = data.slice(startIndex, endIndex);
        
        this.setData({
          startIndex,
          endIndex,
          visibleData
        });
        
        this.triggerEvent('scroll', {
          startIndex,
          endIndex,
          scrollTop
        });
      }
    },

    getRealIndex: function (index) {
      return this.data.startIndex + index;
    },

    scrollToIndex: function (index) {
      const { itemHeight } = this.properties;
      wx.pageScrollTo({
        scrollTop: index * itemHeight,
        duration: 300
      });
    }
  }
});