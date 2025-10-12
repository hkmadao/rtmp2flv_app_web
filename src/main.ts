import { createApp } from "vue";
import App from "./App.vue";
import router from '../router'
import { createPinia } from 'pinia'

// import "~/styles/element/index.scss";

import ElementPlus from "element-plus";
// import all element css, uncommented next line
// import "element-plus/dist/index.css";

// or use cdn, uncomment cdn link in `index.html`

import "~/styles/index.scss";
import "uno.css";

// If you want to use ElMessage, import it.
import "element-plus/theme-chalk/src/message.scss";
import zhCn from 'element-plus/es/locale/lang/zh-cn'



const app = createApp(App);
// app.use(ElementPlus);
app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})
app.mount("#app");
