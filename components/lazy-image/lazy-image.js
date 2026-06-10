Component({
  properties: {
    src: {
      type: String,
      value: ''
    },
    width: {
      type: String,
      value: '100%'
    },
    height: {
      type: String,
      value: '100%'
    },
    mode: {
      type: String,
      value: 'aspectFill'
    },
    placeholderSrc: {
      type: String,
      value: ''
    },
    loadingSrc: {
      type: String,
      value: ''
    }
  },
  data: {
    loaded: false,
    loading: false,
    error: false,
    observer: null
  },
  lifetimes: {
    attached() {
      this.initObserver();
    },
    detached() {
      if (this.data.observer) {
        this.data.observer.disconnect();
      }
    }
  },
  methods: {
    scheduleSetData(changes) {
      if (!this._pendingSetData) this._pendingSetData = {};
      Object.assign(this._pendingSetData, changes);
      if (!this._flushScheduled) {
        this._flushScheduled = true;
        setTimeout(() => {
          this._flushScheduled = false;
          try {
            this.setData(this._pendingSetData);
          } catch (e) {
            for (const k in this._pendingSetData) {
              const o = {};
              o[k] = this._pendingSetData[k];
              this.setData(o);
            }
          }
          this._pendingSetData = {};
        }, 16);
      }
    },

    initObserver() {
      if (typeof IntersectionObserver === 'undefined') {
        // 不支持IntersectionObserver，直接加载图片
        this.loadImage();
        return;
      }
      
      const observer = wx.createIntersectionObserver(this, {
        thresholds: [0.1],
        observeAll: false
      });
      
      observer.observe('.lazy-image-container', (res) => {
        if (res.intersectionRatio > 0) {
          this.loadImage();
          observer.disconnect();
          this.scheduleSetData({ observer: null });
        }
      });
      
      this.scheduleSetData({ observer });
    },
    loadImage() {
      if (this.data.loaded || this.data.loading) {
        return;
      }
      
      this.scheduleSetData({ loading: true, error: false });
      
      // 模拟图片加载
      setTimeout(() => {
        this.scheduleSetData({ loading: false, loaded: true, error: false });
        this.triggerEvent('load');
      }, 500);
    },
    onImageLoad(e) {
      this.scheduleSetData({ loading: false, loaded: true, error: false });
      this.triggerEvent('load', e.detail);
    },
    onImageError(e) {
      this.scheduleSetData({ loading: false, loaded: false, error: true });
      this.triggerEvent('error', e.detail);
    }
  }
});
