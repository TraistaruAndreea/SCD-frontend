<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import auth from '../auth';

const router = useRouter();

const loginUsername = ref('');
const loginPassword = ref('');
const loginError = ref(null);

const login = async () => {
  loginError.value = null;
  try {
    await auth.login(loginUsername.value, loginPassword.value);
    await router.replace('/');
  } catch (e) {
    loginError.value = e.response?.data || e.message || 'Login failed';
  }
};
</script>

<template>
  <div class="page">
    <div class="card-wrap">
      <div class="decor" aria-hidden></div>
      <div class="card">
        <div class="login-grid">
          <div class="login-left">
            <div class="card-header">
              <div>
                <p class="brand">PRICE.RO</p>
              </div>
            </div>

            <div class="card-body">
              <form class="form" @submit.prevent="login">
                <label class="field">
                  <span class="label">Username</span>
                  <input
                    type="text"
                    v-model="loginUsername"
                    autocomplete="username"
                    placeholder="Enter username"
                  />
                </label>

                <label class="field">
                  <span class="label">Password</span>
                  <input
                    type="password"
                    v-model="loginPassword"
                    autocomplete="current-password"
                    placeholder="Enter password"
                  />
                </label>

                <div class="actions">
                  <div class="links"></div>

                  <button class="cta" type="submit" aria-label="Log in">
                    <span class="cta-text">Log in</span>
                    <span class="cta-icon" aria-hidden="true">→</span>
                  </button>
                </div>

                <div v-if="loginError" class="error" role="alert">{{ loginError }}</div>
              </form>
            </div>
          </div>

          <div class="login-right" aria-hidden="true">
            <img src="/login-art-removebg-preview.png" alt="" class="hero-art" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root{
  --bg: #f3efe8;
  --accent1: #7b3f8f;
  --accent2: #f0b96b;
  --card: linear-gradient(180deg, #efe9e3 0%, #f7f5f3 100%);
  --muted: #7b7b7b;
}
.page{
  min-height:100vh;
  width: 100%;
  display:flex;
  align-items:center;
  justify-content:center;
  background: linear-gradient(180deg, #efe9e3 0%, #f7f5f3 100%);
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}
.card-wrap{position:relative;width:min(640px, 92vw);}
.decor{
  position:absolute;left:0;right:0;top:-40px;height:140px;background:linear-gradient(135deg,var(--accent1),var(--accent2));border-radius:28px;transform:rotate(-6deg);filter:blur(6px);z-index:0;
}
.login-grid{display:grid;grid-template-columns: 1.05fr 0.95fr;gap:28px;align-items:stretch}
.login-left{min-width:0;position:relative;z-index:2}
.login-right{display:flex;align-items:flex-start;justify-content:flex-end;overflow:hidden;border-radius:22px;background:rgba(255,255,255,0.55);border:1px solid rgba(39,39,42,0.08);padding:16px 10px 16px 18px;position:relative;z-index:1}
.hero-art{width:min(420px, 120%);height:auto;pointer-events:none;transform:translateX(18px);filter:drop-shadow(0 18px 36px rgba(16,24,40,0.12))}
.card{
  position:relative;
  z-index:1;
  border-radius:28px;
  padding:26px 22px 22px;
  box-shadow:0 16px 50px rgba(16,24,40,0.12);
  overflow:hidden;
  background:
    radial-gradient(1200px 420px at -20% -20%, rgba(123,63,143,0.14), transparent 60%),
    radial-gradient(1000px 400px at 120% 0%, rgba(240,185,107,0.18), transparent 55%),
    rgba(255,255,255,0.92);
  backdrop-filter: blur(10px);
}
.card-header{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px}
.brand{margin:0 0 6px;font-size:16px;letter-spacing:0.18em;font-weight:700;color:rgba(10, 0, 27, 0.66)}
.card-body{margin-top:8px}
.form{margin-top:10px}
.field{display:block;margin:18px 0}
.label{display:block;font-size:12px;color:var(--muted);margin-bottom:8px}
.field input{width:100%;padding:12px 14px;border:1px solid rgba(39,39,42,0.10);border-radius:12px;font-size:14px;outline:none;background:rgba(255,255,255,0.75)}
.field input:focus{box-shadow:0 10px 24px rgba(123,63,143,0.12);border-color:rgba(123,63,143,0.45)}
.actions{display:flex;align-items:center;gap:14px;margin-top:6px}
.links{display:flex;gap:12px}
.cta{display:flex;align-items:center;gap:10px;border:none;cursor:pointer;padding:10px 14px;border-radius:999px;background:rgba(123,63,143,0.98);box-shadow:0 12px 28px rgba(123,63,143,0.24);color:white;white-space:nowrap}
.cta:active{transform:translateY(1px)}
.cta-text{font-weight:700;font-size:13px}
.cta-icon{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:rgba(255,255,255,0.16)}
.error{color:#b00020;margin-top:12px;background:rgba(176,0,32,0.08);border:1px solid rgba(176,0,32,0.18);padding:10px 12px;border-radius:12px;white-space:pre-wrap}

@media (max-width:720px){
  .login-grid{grid-template-columns:1fr}
  .login-right{display:none}
}
</style>
