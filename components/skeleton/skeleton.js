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
      this.setData({ visible: this.properties.loading })
    }
  },

  observers: {
    loading: function (newVal) {
      this.setData({ visible: newVal })
    }
  },

  methods: {
    show() {
      this.setData({ visible: true })
      this.triggerEvent('show')
    },

    hide() {
      this.setData({ visible: false })
      this.triggerEvent('hide')
    },

    toggle() {
      this.setData({ visible: !this.data.visible })
    }
  }
})