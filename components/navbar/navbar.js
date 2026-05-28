Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    showBack: {
      type: Boolean,
      value: false
    },
    showRight: {
      type: Boolean,
      value: false
    }
  },
  methods: {
    goBack: function () {
      wx.navigateBack({
        delta: 1
      });
    }
  }
});
