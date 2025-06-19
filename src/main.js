import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router.js';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import { createPinia } from 'pinia';

import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'

const options = {
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  position: 'top-center',
  hideProgressBar: true,
  maxToasts: 3,
  transition: 'Vue-Toastification__fade',
};

const app = createApp(App);
const pinia = createPinia();

app.component('VueDatePicker', VueDatePicker);

app.use(router).use(pinia).use(Toast, options).mount('#app');