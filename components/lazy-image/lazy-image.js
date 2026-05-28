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
          this.setData({ observer: null });
        }
      });
      
      this.setData({ observer });
    },
    loadImage() {
      if (this.data.loaded || this.data.loading) {
        return;
      }
      
      this.setData({ loading: true, error: false });
      
      // 模拟图片加载
      setTimeout(() => {
        this.setData({ loading: false, loaded: true, error: false });
        this.triggerEvent('load');
      }, 500);
    },
    onImageLoad(e) {
      this.setData({ loading: false, loaded: true, error: false });
      this.triggerEvent('load', e.detail);
    },
    onImageError(e) {
      this.setData({ loading: false, loaded: false, error: true });
      this.triggerEvent('error', e.detail);
    }
  }
});
