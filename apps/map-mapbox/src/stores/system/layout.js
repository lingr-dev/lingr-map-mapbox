import { LAYOUT_DEFAULT } from '@/constants/application.js';

const usePageLayout = defineStore('pageLayout', {
  state() {
    return {
      layout: LAYOUT_DEFAULT,

      leftWidth: 360,
      leftVisible: true,

      rightWidth: 300,
      rightVisible: false,
    };
  },
});

export { usePageLayout };
