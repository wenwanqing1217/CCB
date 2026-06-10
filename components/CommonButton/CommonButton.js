/**
 * 公共按钮组件
 * 提供统一的按钮样式和交互动画效果
 */

const { clickThrottle } = require('../../utils/index.js');

Component({
  properties: {
    type: {
      type: String,
      value: 'primary'
    },
    size: {
      type: String,
      value: 'normal'
    },
    disabled: {
      type: Boolean,
      value: false
    },
    loading: {
      type: Boolean,
      value: false
    },
    loadingText: {
      type: String,
      value: '加载中...'
    },
    icon: {
      type: String,
      value: ''
    },
    iconPosition: {
      type: String,
      value: 'left'
    },
    round: {
      type: Boolean,
      value: false
    },
    block: {
      type: Boolean,
      value: false
    },
    throttle: {
      type: Number,
      value: 800
    },
    customStyle: {
      type: String,
      value: ''
    }
  },

  data: {
    isPressed: false
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

    async handleTap(e) {
      if (this.properties.disabled || this.properties.loading) {
        return;
      }

      const key = `CommonButton-${this._uid}`;
      if (!clickThrottle.canClick(key, this.properties.throttle)) {
        return;
      }

      this.scheduleSetData({ isPressed: true });
      
      setTimeout(() => {
        this.scheduleSetData({ isPressed: false });
      }, 200);

      this.triggerEvent('tap', { event: e });
    },

    async handleLongPress(e) {
      if (this.properties.disabled || this.properties.loading) {
        return;
      }

      this.triggerEvent('longpress', { event: e });
    }
  }
});
