// Runtime patch: inject scheduleSetData into Page and Component instances
module.exports = function initSchedule() {
  try {
    if (typeof Page === 'function') {
      const originalPage = Page;
      Page = function(def) {
        const origOnLoad = def.onLoad;
        def.onLoad = function(...args) {
          if (!this.scheduleSetData) {
            this.scheduleSetData = function(changes) {
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
            };
          }
          if (typeof origOnLoad === 'function') origOnLoad.apply(this, args);
        };
        return originalPage(def);
      };
    }

    if (typeof Component === 'function') {
      const originalComponent = Component;
      Component = function(def) {
        const origAttached = def.lifetimes && def.lifetimes.attached;
        def.lifetimes = def.lifetimes || {};
        def.lifetimes.attached = function(...args) {
          if (!this.scheduleSetData) {
            this.scheduleSetData = function(changes) {
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
            };
          }
          if (typeof origAttached === 'function') origAttached.apply(this, args);
        };
        return originalComponent(def);
      };
    }
  } catch (e) {
    // ignore in environments where Page/Component are not available
    console.warn('initSchedule: failed to patch Page/Component', e);
  }
};
