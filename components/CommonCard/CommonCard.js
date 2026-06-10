/**
 * 公共卡片组件
 * 提供统一的卡片样式和交互效果
 */

Component({
  properties: {
    hoverable: {
      type: Boolean,
      value: true
    },
    padding: {
      type: String,
      value: '24rpx'
    },
    radius: {
      type: String,
      value: '24rpx'
    },
    bordered: {
      type: Boolean,
      value: true
    },
    shadow: {
      type: Boolean,
      value: true
    },
    glow: {
      type: Boolean,
      value: false
    },
    customStyle: {
      type: String,
      value: ''
    }
  },

  data: {
    isHovered: false
  },

  methods: {
    scheduleSetData(changes) {
      if (!this._pendingSetData) this._pendingSetData = {};
      Object.assign(this._pendingSetData, changes);
      if (!this._flushScheduled) {
        this._flushScheduled = true;
        setTimeout(() => {
          this._flushScheduled = false;
          try { this.setData(this._pendingSetData); } catch (e) { for (const k in this._pendingSetData) { const o = {}; o[k] = this._pendingSetData[k]; this.setData(o); } }
          this._pendingSetData = {};
        }, 16);
      }
    },
    handleTap(e) {
      this.triggerEvent('tap', { event: e });
    },

    handleLongPress(e) {
      this.triggerEvent('longpress', { event: e });
    },

    onTouchStart() {
      if (this.properties.hoverable) {
        this.scheduleSetData({ isHovered: true });
      }
    },

    onTouchEnd() {
      if (this.properties.hoverable) {
        this.scheduleSetData({ isHovered: false });
      }
    },

    onTouchCancel() {
      if (this.properties.hoverable) {
        this.scheduleSetData({ isHovered: false });
      }
    }
  }
});
