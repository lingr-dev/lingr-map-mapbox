import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import router from '@/router';
import App from './App.vue';
import { nsLogger } from '@lingr/map-core';
import 'vuetify/styles';
import './style.css';

nsLogger.init(['*:CFG', '*:DBG', '*:LOG', '*:INF', '*:WRN', '*:ERR', '*:NOTE']);

const { appVersion } = navigator;
if (appVersion.indexOf('Win') >= 0) {
  document.body.classList.add('os-windows');
} else if (appVersion.indexOf('Mac') >= 0) {
  document.body.classList.add('os-mac');
} else if (appVersion.indexOf('Linux') >= 0) {
  document.body.classList.add('os-linux');
}

const vuetify = createVuetify({});

const app = createApp(App);
const pinia = createPinia();

app.use(vuetify);
app.use(pinia);
app.use(router);

app.mount('#app');
