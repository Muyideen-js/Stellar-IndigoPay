/**
 * __mocks__/NativeModules.js
 * Mocks react-native/Libraries/BatchedBridge/NativeModules
 * providing a proxy that dynamically returns mocks for any native modules.
 */
const NativeModules = {
  UIManager: {
    customBubblingEventTypes: {},
    customDirectEventTypes: {},
    configureNextLayoutAnimation: jest.fn(),
    getViewManagerConfig: jest.fn(() => ({})),
  },
  default: null,
};
NativeModules.default = NativeModules;

module.exports = new Proxy(NativeModules, {
  get(target, prop) {
    if (prop === 'default') return target;
    if (!(prop in target)) {
      target[prop] = {};
    }
    return target[prop];
  }
});
