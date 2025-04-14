import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from "./router.js";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

const options = {
    timeout: 2000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    position: "top-center",
    hideProgressBar: true,
    maxToasts: 3,
    
}

createApp(App)
    .use(router)
    .use(Toast, options)
    .mount('#app')

