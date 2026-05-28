class ImageProcessor {
  constructor() {
    this.imageCache = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.maxConcurrentPreload = 3;
    this.preloadDelay = 100;
    this.webpSupported = null;
    this.webpDetectionDone = false;
  }

  async detectWebpSupport() {
    if (this.webpDetectionDone) {
      return this.webpSupported;
    }

    return new Promise((resolve) => {
      const image = new (wx.createImage ? wx.createImage() : Image)();
      image.onload = () => {
        this.webpSupported = image.width === 1;
        this.webpDetectionDone = true;
        resolve(this.webpSupported);
      };
      image.onerror = () => {
        this.webpSupported = false;
        this.webpDetectionDone = true;
        resolve(false);
      };
      image.src = 'data:image/webp;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==';
    });
  }

  async compressImage(filePath, options = {}) {
    const {
      quality = 0.8,
      maxWidth = 800,
      maxHeight = 800,
      autoQuality = true,
      format = 'original'
    } = options;

    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: filePath,
        success: (res) => {
          const { width, height, size } = res;
          let newWidth = width;
          let newHeight = height;
          let compressQuality = quality;

          if (autoQuality) {
            if (size > 5 * 1024 * 1024) {
              compressQuality = 0.6;
            } else if (size > 2 * 1024 * 1024) {
              compressQuality = 0.7;
            } else if (size > 1 * 1024 * 1024) {
              compressQuality = 0.8;
            }
          }

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              newWidth = maxWidth;
              newHeight = (height * maxWidth) / width;
            } else {
              newHeight = maxHeight;
              newWidth = (width * maxHeight) / height;
            }
          }

          wx.compressImage({
            src: filePath,
            quality: compressQuality * 100,
            success: (compressRes) => {
              console.log(`图片压缩成功，原大小: ${(size / 1024).toFixed(2)}KB`);
              
              if (format === 'webp') {
                this.convertToWebp(compressRes.tempFilePath).then(webpPath => {
                  resolve(webpPath);
                }).catch(() => {
                  resolve(compressRes.tempFilePath);
                });
              } else {
                resolve(compressRes.tempFilePath);
              }
            },
            fail: (err) => {
              console.error('压缩图片失败:', err);
              if (format === 'webp') {
                this.convertToWebp(filePath).then(webpPath => {
                  resolve(webpPath);
                }).catch(() => {
                  resolve(filePath);
                });
              } else {
                resolve(filePath);
              }
            }
          });
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(err);
        }
      });
    });
  }

  async convertToWebp(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        encoding: 'base64',
        success: (res) => {
          const base64Data = res.data;
          const ext = filePath.split('.').pop().toLowerCase();
          const prefix = `data:image/${ext};base64,`;
          
          wx.request({
            url: 'https://api.traekernel.cn/api/image/convert',
            method: 'POST',
            data: {
              image: prefix + base64Data,
              format: 'webp',
              quality: 80
            },
            success: (response) => {
              if (response.data && response.data.success && response.data.webpBase64) {
                const webpBase64 = response.data.webpBase64.split(',')[1];
                const webpPath = `${wx.env.USER_DATA_PATH}/temp_${Date.now()}.webp`;
                
                wx.getFileSystemManager().writeFile({
                  filePath: webpPath,
                  data: webpBase64,
                  encoding: 'base64',
                  success: () => {
                    resolve(webpPath);
                  },
                  fail: () => {
                    resolve(filePath);
                  }
                });
              } else {
                resolve(filePath);
              }
            },
            fail: () => {
              resolve(filePath);
            }
          });
        },
        fail: () => {
          resolve(filePath);
        }
      });
    });
  }

  async compressImages(filePaths, options = {}) {
    const compressPromises = filePaths.map(filePath => 
      this.compressImage(filePath, options).catch(err => {
        console.error('压缩图片失败:', err);
        return filePath;
      })
    );
    return Promise.all(compressPromises);
  }

  async uploadImage(filePath, folder = 'images', options = {}) {
    const { useWebp = true } = options;
    let uploadPath = filePath;
    
    if (useWebp) {
      const webpSupported = await this.detectWebpSupport();
      if (webpSupported) {
        try {
          uploadPath = await this.convertToWebp(filePath);
        } catch (err) {
          console.error('转换为WebP失败:', err);
        }
      }
    }

    const ext = uploadPath.split('.').pop();
    const cloudPath = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;

    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: uploadPath,
        success: (res) => {
          console.log('图片上传成功:', res.fileID);
          resolve({
            fileID: res.fileID,
            isWebp: ext === 'webp'
          });
        },
        fail: (err) => {
          console.error('上传图片失败:', err);
          reject(err);
        }
      });
    });
  }

  async uploadImages(filePaths, folder = 'images', options = {}) {
    const { maxConcurrent = 3, useWebp = true } = options;
    const results = [];
    for (let i = 0; i < filePaths.length; i += maxConcurrent) {
      const batch = filePaths.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(path => this.uploadImage(path, folder, { useWebp }).catch(err => {
          console.error('上传图片失败:', err);
          return null;
        }))
      );
      results.push(...batchResults);
    }
    return results;
  }

  async compressAndUpload(filePaths, options = {}, folder = 'images') {
    const { useWebp = true, ...compressOptions } = options;
    const compressedPaths = await this.compressImages(filePaths, compressOptions);
    return this.uploadImages(compressedPaths, folder, { useWebp });
  }

  getWebpUrl(url) {
    if (!url) {
      return url;
    }
    if (url.includes('.webp')) {
      return url;
    }
    if (url.includes('cloud://')) {
      return url.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
    }
    if (url.includes('?')) {
      return url.replace(/\.(jpg|jpeg|png|gif)\?/i, '.webp?');
    }
    return url.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
  }

  optimizeImageUrl(url, options = {}) {
    const {
      width = 400,
      height = 400,
      quality = 80,
      preferWebp = true
    } = options;

    let optimizedUrl = url;
    
    if (preferWebp) {
      optimizedUrl = this.getWebpUrl(url);
    }

    if (optimizedUrl && optimizedUrl.includes('cloud://')) {
      return `${optimizedUrl}?width=${width}&height=${height}&quality=${quality}`;
    }
    
    if (optimizedUrl && optimizedUrl.includes('?')) {
      return `${optimizedUrl}&width=${width}&height=${height}&quality=${quality}`;
    }
    
    if (optimizedUrl) {
      return `${optimizedUrl}?width=${width}&height=${height}&quality=${quality}`;
    }
    
    return url;
  }

  preloadImage(url, retryCount = 2) {
    if (this.imageCache.has(url)) {
      return;
    }

    const webpUrl = this.getWebpUrl(url);
    
    this.preloadQueue.push({ url: webpUrl, retryCount, originalUrl: url });
    if (!this.isPreloading) {
      this.processPreloadQueue();
    }
  }

  async processPreloadQueue() {
    if (this.preloadQueue.length === 0) {
      this.isPreloading = false;
      return;
    }

    this.isPreloading = true;
    
    const batch = this.preloadQueue.splice(0, this.maxConcurrentPreload);
    const preloadPromises = batch.map(item => this.preloadImageWithRetry(item.url, item.retryCount, item.originalUrl));
    
    await Promise.all(preloadPromises);
    
    setTimeout(() => {
      this.processPreloadQueue();
    }, this.preloadDelay);
  }

  preloadImageWithRetry(url, retryCount, originalUrl) {
    return new Promise((resolve) => {
      const attemptPreload = (remainingRetries) => {
        wx.getImageInfo({
          src: url,
          success: () => {
            this.imageCache.set(url, true);
            if (originalUrl && originalUrl !== url) {
              this.imageCache.set(originalUrl, true);
            }
            resolve();
          },
          fail: (err) => {
            if (err.errMsg.includes('url not in domain list')) {
              console.log('预加载图片跳过（域名未配置）:', url);
              resolve();
            } else if (remainingRetries > 0) {
              console.log(`预加载图片失败，剩余重试次数: ${remainingRetries}`, url);
              setTimeout(() => {
                attemptPreload(remainingRetries - 1);
              }, 500);
            } else {
              console.error('预加载图片失败:', url, err);
              if (originalUrl && originalUrl !== url) {
                this.preloadImageWithRetry(originalUrl, 0);
              }
              resolve();
            }
          }
        });
      };

      attemptPreload(retryCount);
    });
  }

  preloadImages(urls) {
    urls.forEach(url => this.preloadImage(url));
  }

  clearCache() {
    this.imageCache.clear();
    this.preloadQueue = [];
    console.log('图片缓存已清除');
  }

  isCached(url) {
    if (this.imageCache.has(url)) {
      return true;
    }
    const webpUrl = this.getWebpUrl(url);
    return this.imageCache.has(webpUrl);
  }

  getCacheSize() {
    return this.imageCache.size;
  }

  async getImageSize(url) {
    return new Promise((resolve) => {
      wx.getImageInfo({
        src: url,
        success: (res) => {
          resolve({ width: res.width, height: res.height, size: res.size });
        },
        fail: () => {
          resolve(null);
        }
      });
    });
  }

  async estimateWebpSavings(urls) {
    let totalOriginalSize = 0;
    let totalWebpSize = 0;
    
    for (const url of urls) {
      const originalInfo = await this.getImageSize(url);
      if (originalInfo) {
        totalOriginalSize += originalInfo.size;
        totalWebpSize += Math.floor(originalInfo.size * 0.5);
      }
    }
    
    return {
      originalSize: totalOriginalSize,
      webpSize: totalWebpSize,
      savings: totalOriginalSize - totalWebpSize,
      savingsPercent: totalOriginalSize > 0 
        ? ((totalOriginalSize - totalWebpSize) / totalOriginalSize * 100).toFixed(2) 
        : '0.00'
    };
  }
}

module.exports = new ImageProcessor();