const { toast } = require('../../utils/index.js');
const { MAIN_DORMS } = require('../../utils/campusData.js');
const imageProcessor = require('../../utils/imageProcessor.js');

Page({
  data: {
    form: {
      title: '',
      desc: '',
      type: 'secondhand',
      mode: 'light',
      price: '',
      campus: '中园公寓',
      dormNumber: ''
    },
    images: [],
    submitting: false,
    types: [
      { value: 'stationery', label: '文具盲盒' },
      { value: 'clothing', label: '服饰盲盒' },
      { value: 'book', label: '图书盲盒' },
      { value: 'snack', label: '零食盲盒' },
      { value: 'digital', label: '数码盲盒' },
      { value: 'secondhand', label: '二手盲盒' },
      { value: 'original', label: '原创盲盒' }
    ],
    modes: [
      { value: 'light', label: '明盒' },
      { value: 'dark', label: '暗盒' }
    ],
    campuses: MAIN_DORMS,
    typeIndex: 0,
    modeIndex: 0,
    selectedTypeLabel: '文具盲盒',
    selectedModeLabel: '明盒',
    descSuggestions: [
      '笔、本子、尺子、橡皮等文具一应俱全',
      'T恤、袜子、帽子等时尚单品',
      '小说、教材、课外书等知识盲盒',
      '各种网红零食、进口美食组合',
      '手机壳、数据线、耳机等数码配件'
    ]
  },

  onLoad() {
    this.updateSelectedLabels();
  },

  onShow() {
    // 设置自定义 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
  },

  updateSelectedLabels() {
    const { form, types, modes } = this.data;
    const typeIndex = types.findIndex(item => item.value === form.type);
    const modeIndex = modes.findIndex(item => item.value === form.mode);
    const selectedTypeLabel = types[typeIndex]?.label || '文具盲盒';
    const selectedModeLabel = modes[modeIndex]?.label || '明盒';
    this.setData({
      typeIndex,
      modeIndex,
      selectedTypeLabel,
      selectedModeLabel
    });
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      form: {
        ...this.data.form,
        [field]: value
      }
    });
  },

  useSuggestion(e) {
    const suggestion = e.currentTarget.dataset.suggestion;
    this.setData({
      'form.desc': suggestion
    });
  },

  aiPolish() {
    const desc = this.data.form.desc;
    if (!desc) {
      toast.info('请先简单写一下简介');
      return;
    }
    
    toast.loading('润色中...');
    
    // 模拟AI润色效果
    setTimeout(() => {
      const polishedDesc = this.polishText(desc);
      this.setData({
        'form.desc': polishedDesc
      });
      toast.hideLoading();
      toast.success('润色完成');
    }, 1000);
  },

  polishText(text) {
    const templates = [
      '🌟 {text}，快来挑选吧！',
      '✨ {text}，品质保证！',
      '💝 {text}，机会难得哦～',
      '🎁 {text}，物超所值！',
      '🌈 {text}，欢迎选购！'
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace('{text}', text);
  },

  bindTypeChange(e) {
    const type = this.data.types[e.detail.value].value;
    this.setData({
      'form.type': type
    });
    this.updateSelectedLabels();
  },

  bindModeChange(e) {
    const mode = this.data.modes[e.detail.value].value;
    this.setData({
      'form.mode': mode
    });
    this.updateSelectedLabels();
  },

  bindCampusChange(e) {
    this.setData({
      'form.campus': this.data.campuses[e.detail.value]
    });
  },

  chooseImage() {
    wx.chooseImage({
      count: 9 - this.data.images.length,
      success: (res) => {
        const paths = res.tempFilePaths || res.tempFiles.map(f => f.path);
        this.setData({
          images: this.data.images.concat(paths)
        });
      }
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({ images });
  },

  async uploadImages() {
    if (!this.data.images.length) {
      return [];
    }
    try {
      // 使用图片处理工具压缩并上传图片
      const imageIds = await imageProcessor.compressAndUpload(
        this.data.images,
        { quality: 0.7, maxWidth: 800, maxHeight: 800 },
        'boxes'
      );
      return imageIds;
    } catch (err) {
      console.error('上传图片失败:', err);
      // 失败时使用原始上传方式
      const uploads = this.data.images.map((path, index) => {
        const ext = path.split('.').pop();
        const cloudPath = `boxes/${Date.now()}_${index}.${ext}`;
        return wx.cloud.uploadFile({
          cloudPath,
          filePath: path
        }).then(res => res.fileID);
      });
      return Promise.all(uploads);
    }
  },

  async onSubmit() {
    const { title, desc, type, mode, price, campus, dormNumber } = this.data.form;
    
    // 详细的表单验证
    if (!title) {
      toast.info('请输入盲盒标题');
      return;
    }
    if (title.length < 2 || title.length > 50) {
      toast.info('标题长度应在2-50字之间');
      return;
    }
    if (!desc) {
      toast.info('请输入盲盒描述');
      return;
    }
    if (desc.length < 10) {
      toast.info('描述至少10字');
      return;
    }
    if (!price) {
      toast.info('请输入价格');
      return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      toast.info('请输入有效的价格');
      return;
    }
    if (!campus) {
      toast.info('请选择校区');
      return;
    }
    if (!dormNumber) {
      toast.info('请输入宿舍号');
      return;
    }
    if (!this.data.images.length) {
      toast.info('请至少上传一张图片');
      return;
    }
    
    this.setData({ submitting: true });
    try {
      toast.loading('发布中...');
      
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo) {
        toast.hideLoading();
        toast.info('请先登录');
        return;
      }
      
      // 安全检查：检查用户行为（防刷单）
      const behaviorCheck = await wx.cloud.callFunction({
        name: 'securityService',
        data: {
          action: 'checkUserBehavior',
          data: {
            openid: userInfo.openid,
            actionType: 'publish',
            timestamp: Date.now()
          }
        }
      });
      
      if (!behaviorCheck.result.success) {
        toast.hideLoading();
        toast.info(behaviorCheck.result.message);
        return;
      }
      
      // 安全检查：检查内容（防内容违规）
      const contentCheck = await wx.cloud.callFunction({
        name: 'securityService',
        data: {
          action: 'checkContent',
          data: {
            content: title + ' ' + desc,
            type: 'box'
          }
        }
      });
      
      if (!contentCheck.result.success) {
        toast.hideLoading();
        toast.info(contentCheck.result.message);
        return;
      }
      
      const imageIds = await this.uploadImages();
      
      const res = await wx.cloud.callFunction({
        name: 'boxService',
        data: {
          action: 'publish',
          data: {
            title,
            desc,
            type,
            mode,
            price: Number(price),
            campus,
            building: dormNumber,
            images: imageIds,
            openid: userInfo.openid
          }
        }
      });
      
      toast.hideLoading();
      if (res.result && res.result.success) {
        toast.success('发布成功');
        setTimeout(() => {
          wx.switchTab({ 
            url: '/pages/index/index',
            success: () => {
              console.log('跳转成功');
            },
            fail: (err) => {
              console.error('跳转失败:', err);
              toast.info('跳转失败，请手动返回首页');
            }
          });
        }, 800);
      } else {
        toast.error('发布失败，请稍后重试');
      }
    } catch (e) {
      console.error('发布错误:', e);
      toast.hideLoading();
      toast.networkError();
    } finally {
      this.setData({ submitting: false });
    }
  }
});
