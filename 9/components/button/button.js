Component({
  properties: {
    type: {
      type: String,
      value: 'primary'
    },
    size: {
      type: String,
      value: ''
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },
  methods: {
    handleTap: function() {
      if (!this.properties.disabled) {
        this.triggerEvent('tap');
      }
    }
  }
});
