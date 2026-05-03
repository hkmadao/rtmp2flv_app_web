<template>
  <section class="mine-page">
    <div class="mine-page__header">
      <Avatar :size="56">
        <UserOutlined />
      </Avatar>
      <div>
        <h1 class="mine-page__title">我的</h1>
        <p class="mine-page__summary">
          {{ session ? "当前账号已登录" : "登录后可查看主播直播" }}
        </p>
      </div>
    </div>

    <Card
      v-if="session"
      class="mine-page__panel"
      :body-style="{ padding: '16px' }"
    >
      <div class="mine-page__info-row">
        <span>账号</span>
        <strong>{{ session.userInfo.account || "-" }}</strong>
      </div>
      <div class="mine-page__info-row">
        <span>用户名</span>
        <strong>{{
          session.userInfo.username || session.userInfo.nickName || "-"
        }}</strong>
      </div>
      <Button block danger @click="handleLogout" :loading="loading">
        <template #icon><LogoutOutlined /></template>
        退出登录
      </Button>
    </Card>

    <Card v-else class="mine-page__panel" :body-style="{ padding: '16px' }">
      <div class="mine-page__form">
        <label class="mine-page__field">
          <span>账号</span>
          <Input v-model:value="form.username" placeholder="请输入账号" />
        </label>
        <label class="mine-page__field">
          <span>密码</span>
          <Input
            v-model:value="form.password"
            type="password"
            placeholder="请输入密码"
          />
        </label>
        <label class="mine-page__field">
          <span> 记住我 <Checkbox v-model:checked="form.remember" /> </span>
        </label>
        <Button type="primary" block @click="handleLogin" :loading="loading">
          <template #icon><LoginOutlined /></template>
          登录
        </Button>
        <div>或者选择以下用户登录：</div>
        <Button
          v-for="(rUser, index) in rememberUsers"
          :key="rUser.username!"
          @click="handleSelectLogin(rUser.username!)"
          >{{ rUser.username }}</Button
        >
      </div>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { md5 } from "js-md5";
import { Avatar, Button, Card, Checkbox, Input, message } from "ant-design-vue";
import {
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";
import {
  clearLoginLocalStorage,
  clearRememberUser,
  getAllRememberUser,
  getLoginLocalStorage,
  getLonginUser,
  getRememberUser,
  LoginStorage,
  setLoginLocalStorage,
  setRememberUser,
  TUser,
} from "../../localStorage";
import { login, logout } from "../../api/liveApp";

const session = ref<LoginStorage | undefined>(getLoginLocalStorage());
const rememberUsers = ref<TUser[]>(getAllRememberUser());
const loading = ref(false);
const form = reactive({
  username: "",
  password: "",
  remember: true,
});

const handleSelectLogin = async (username: string) => {
  const rememberUser = getRememberUser(username!);
  if (!rememberUser) {
    message.error("找不到用户信息");
    return;
  }
  loading.value = true;
  try {
    const loginParam = {
      username: username,
      password: rememberUser.password,
      remember: rememberUser.remember,
    };
    const nextLocalStorage = await login(loginParam);
    setLoginLocalStorage(nextLocalStorage);
    setRememberUser(loginParam);
    session.value = nextLocalStorage;
    message.success("登录成功");
  } catch (err) {
    message.error(`登录失败：${String(err)}`);
  } finally {
    loading.value = false;
  }
};

const handleLogin = async () => {
  if (!form.username || !form.password) {
    message.warning("请输入账号和密码");
    return;
  }

  loading.value = true;
  try {
    let password = md5(form.password).toUpperCase();
    const loginParam = {
      username: form.username,
      password: password,
      remember: form.remember,
    };
    const nextLocalStorage = await login(loginParam);
    setLoginLocalStorage(nextLocalStorage);
    if (form.remember) {
      setRememberUser(loginParam);
    } else {
      clearRememberUser(loginParam.username);
    }
    session.value = nextLocalStorage;
    form.password = "";
    message.success("登录成功");
  } catch (err) {
    message.error(`登录失败：${String(err)}`);
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  loading.value = true;
  try {
    await logout();
    const loginUser = getLonginUser();
    clearRememberUser(loginUser.username!);
    clearLoginLocalStorage();
    rememberUsers.value = getAllRememberUser();
    session.value = undefined;
    message.success("已退出登录");
  } catch (err) {
    message.error(`退出失败：${String(err)}`);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.mine-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 12px;
  text-align: left;
}

.mine-page__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mine-page__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  color: #111827;
}

.mine-page__summary {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.mine-page__panel {
  border-radius: 8px;
}

.mine-page__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mine-page__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #374151;
}

.mine-page__info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.mine-page__info-row strong {
  color: #111827;
  overflow-wrap: anywhere;
}

.mine-page__info-row:last-of-type {
  margin-bottom: 16px;
}
</style>
