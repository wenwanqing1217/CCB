Component({
  properties: {
    loading: {
      type: Boolean,
      value: false
    },
    type: {
      type: String,
      value: 'default',
      options: ['default', 'list', 'detail', 'profile']
    },
    animated: {
      type: Boolean,
      value: true
    },
    theme: {
      type: String,
      value: 'dark',
      options: ['dark', 'light']
    }
  },

  data: {
    visible: false
  },

  lifetimes: {
    attached() {
      if (this.scheduleSetData) {
        this.scheduleSetData({ visible: this.properties.loading });
      } else {
        this.setData({ visible: this.properties.loading });
      }
    }
  },

  observers: {
    loading: function (newVal) {
      if (this.scheduleSetData) {
        this.scheduleSetData({ visible: newVal });
      } else {
        this.setData({ visible: newVal });
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
          try { this.setData(this._pendingSetData); } catch (e) { for (const k in this._pendingSetData) { const o = {}; o[k] = this._pendingSetData[k]; this.setData(o); } }
          this._pendingSetData = {};
        }, 16);
      }
    },

    show() {
      this.scheduleSetData({ visible: true });
      this.triggerEvent('show');
    },

    hide() {
      this.scheduleSetData({ visible: false });
      this.triggerEvent('hide');
    },

    toggle() {
      this.scheduleSetData({ visible: !this.data.visible });
    }
  }
});