// ============================================
// ⚠️ لینک اسکریپت خود را اینجا قرار دهید
const API_URL = "https://script.google.com/macros/s/AKfycbwGTi5x558NO2dq_ylKfGKnfntdRW03eiBzAfpGfgrqZrFMLkWfnqEhPSE2mT8pCWNHdw/exec"; 
// ============================================

const Alert = {
  show: (title, message, icon = 'info', showCancel = false) => {
    return new Promise((resolve) => {
      const overlay = document.getElementById('custom-alert-overlay');
      if (!overlay) return resolve(true);

      const titleEl = document.getElementById('alert-title');
      const msgEl = document.getElementById('alert-message');
      const iconEl = document.getElementById('alert-icon');
      const okBtn = document.getElementById('alert-ok');
      const cancelBtn = document.getElementById('alert-cancel');

      const icons = { success: '✅', error: '⛔', warning: '⚠️', info: 'ℹ️' };
      iconEl.textContent = icons[icon] || icons.info;
      titleEl.textContent = title;
      msgEl.textContent = message;

      cancelBtn.classList.toggle('hidden', !showCancel);
      
      const newOk = okBtn.cloneNode(true);
      const newCancel = cancelBtn.cloneNode(true);
      okBtn.parentNode.replaceChild(newOk, okBtn);
      cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

      newOk.addEventListener('click', () => { overlay.classList.add('hidden'); resolve(true); });
      newCancel.addEventListener('click', () => { overlay.classList.add('hidden'); resolve(false); });

      overlay.classList.remove('hidden');
    });
  },
  success: (msg) => Alert.show('موفق', msg, 'success'),
  error: (msg) => Alert.show('خطا', msg, 'error'),
  confirm: (msg) => Alert.show('تایید', msg, 'warning', true)
};

const Loader = {
  show: (text = "لطفاً صبر کنید...") => {
    const loader = document.getElementById('loading-overlay');
    if (loader) {
      document.querySelector('.loading-text').textContent = text;
      loader.classList.remove('hidden');
    }
  },
  hide: () => {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.classList.add('hidden');
  }
};

let LICENSE = localStorage.getItem('license');
let CONFIG = JSON.parse(localStorage.getItem('config') || '{}');
let tempContinuousData = [];

const UI = {
  renderHome: () => {
    const app = document.getElementById('app-root');
    const logoSrc = CONFIG.logoUrl || ''; 
    const compName = CONFIG.companyName || 'سیستم زمان‌سنجی';
    
    app.style.display = 'flex';
    app.innerHTML = `
      <div class="view active">
        <div style="text-align:center; margin-bottom:30px; margin-top:20px;">
          ${logoSrc ? `<img src="${logoSrc}" class="company-logo">` : ''}
          <h2 style="margin:0; color:#555;">${compName}</h2>
        </div>
        
        <button class="btn btn-primary" onclick="UI.renderWorkstation()">🏭 زمان‌سنجی کارگاهی</button>
        <button class="btn btn-secondary" onclick="UI.renderContinuous()">🔄 زمان‌سنجی پیوسته</button>
        
        <div style="margin-top:50px; text-align:center; font-size:0.85rem; color:#777;">
          <p>کد مشتری: <b>${LICENSE}</b></p>
          <div id="offline-status" style="margin-bottom:10px;">صف ارسال: ${getQueueLength()}</div>
          <button onclick="syncData(true)" class="btn btn-gray" style="width:auto; display:inline-flex; padding:8px 20px; font-size:0.8rem;">🔄 ارسال دستی</button>
          <br><br>
          <a href="#" onclick="logout()" style="color:var(--danger); text-decoration:none;">خروج از حساب</a>
        </div>
      </div>
    `;
  },

  renderWorkstation: () => {
    document.getElementById('app-root').innerHTML = `
      <div class="view active">
        <div class="header-row">
          <button onclick="UI.renderHome()" class="btn btn-gray" style="width:auto; padding:8px 15px;">🏠</button>
          <h3 style="margin:0;">کارگاهی</h3>
        </div>
        ${createSelects()}
        <div class="timer-box">
          <div class="timer-display" id="display">00:00.00</div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
          <button id="btn-rec" onclick="Timer.record()" disabled class="btn btn-primary">🚩 ثبت</button>
          <button id="btn-start" onclick="Timer.start()" class="btn btn-success">▶ شروع</button>
          <button id="btn-save" onclick="Timer.finishWorkstation()" disabled class="btn btn-danger">📤 ارسال</button>
        </div>
        <div id="laps-list" style="margin-top:20px; max-height:200px; overflow-y:auto;"></div>
      </div>
    `;
    restoreSelects();
  },

  renderContinuous: () => {
    tempContinuousData = [];
    document.getElementById('app-root').innerHTML = `
      <div class="view active">
        <div class="header-row">
          <button onclick="UI.renderHome()" class="btn btn-gray" style="width:auto; padding:8px 15px;">🏠</button>
          <h3 style="margin:0;">پیوسته</h3>
        </div>
        ${createSelects()}
        <div class="timer-box" style="background:#fffbf0; border-color:#fbbc04;">
          <div class="timer-display" id="display" style="color:#f57c00;">00:00.00</div>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
          <button id="btn-stop" onclick="Timer.stop()" disabled class="btn btn-danger">⏸ توقف</button>
          <button id="btn-start" onclick="Timer.start(true)" class="btn btn-success">▶ شروع</button>
          <button onclick="Timer.reset()" class="btn btn-gray">⏹ ریست</button>
        </div>

        <div style="background:#f9f9f9; padding:15px; border-radius:10px; margin-top:20px; border:1px solid #eee;">
          <label style="font-size:0.9rem; font-weight:bold;">تعداد تولید:</label>
          <div style="display:flex; gap:10px; margin-top:5px;">
            <input type="number" id="prod-count" placeholder="0" style="margin:0;">
            <button onclick="Timer.addContinuousCycle()" class="btn btn-secondary" style="width:auto; padding:0 20px; margin:0;">➕ افزودن</button>
          </div>
        </div>

        <div id="cycle-list" style="margin-top:15px; max-height:150px; overflow-y:auto; border-top:1px solid #eee;"></div>

        <button id="btn-final-send" onclick="Timer.finishContinuous()" class="btn btn-primary" style="margin-top:20px;" disabled>📤 تجمیع و ارسال نهایی</button>
      </div>
    `;
    restoreSelects();
  },
  
  showSetupWizard: (data) => {
    const app = document.getElementById('app-root');
    app.style.display = 'flex';
    app.innerHTML = `
      <div class="view active" style="padding:30px; text-align:center;">
        <h2>🚀 راه‌اندازی اولیه</h2>
        <div style="background:#e3f2fd; padding:15px; border-radius:10px; margin-bottom:20px; text-align:right;">
          <b>گام ۱:</b> روی دکمه زیر کلیک کنید تا فایل شما ساخته شود.<br>
          <a href="${data.templateUrl}" target="_blank" class="btn btn-secondary" style="margin-top:10px;">📂 ساخت فایل دیتابیس</a>
        </div>
        <div style="background:#fff3e0; padding:15px; border-radius:10px; margin-bottom:20px; text-align:right;">
          <b>گام ۲:</b> فایل جدید را باز کنید، دکمه Share را بزنید و این ایمیل را <b>Editor</b> کنید:<br>
          <code style="display:block; background:#fff; padding:5px; margin:5px 0; border:1px solid #ccc; text-align:center;">${data.botEmail}</code>
        </div>
        <div style="background:#e8f5e9; padding:15px; border-radius:10px; text-align:right;">
          <b>گام ۳:</b> آدرس فایل ساخته شده را وارد کنید:<br>
          <input id="sheet-url" placeholder="https://docs.google.com/..." style="width:100%; direction:ltr; margin-top:5px;">
          <button onclick="completeSetup()" class="btn btn-primary">🔗 اتصال</button>
        </div>
      </div>
    `;
  },
  
  showMaintenance: () => {
    document.getElementById('maintenance-overlay').style.display = 'flex';
    document.getElementById('app-root').style.display = 'none';
    Loader.hide();
  },
  
  showErrorPage: (title, msg) => {
    document.body.innerHTML = `
      <div style="text-align:center; padding:50px; font-family:Tahoma;">
        <h1 style="color:var(--danger); font-size:4rem;">⛔</h1>
        <h2 style="color:#333;">${title}</h2>
        <p style="color:#666;">${msg}</p>
        <button class="btn btn-gray" onclick="logout()" style="width:auto; display:inline-block; margin-top:20px;">خروج</button>
      </div>
    `;
    Loader.hide();
  }
};

function createSelects() {
  const mkOpt = (list) => list ? list.map(i => `<option value="${i}">${i}</option>`).join('') : '';
  const onChange = `onchange="saveSelectState(this)"`;
  return `
    <select id="s-shift" ${onChange}><option value="">انتخاب شیفت...</option>${mkOpt(CONFIG.shifts)}</select>
    <select id="s-oper" ${onChange}><option value="">انتخاب اپراتور...</option>${mkOpt(CONFIG.operators)}</select>
    <select id="s-prod" ${onChange}><option value="">انتخاب محصول...</option>${mkOpt(CONFIG.products)}</select>
    <select id="s-stat" ${onChange}><option value="">انتخاب ایستگاه...</option>${mkOpt(CONFIG.stations)}</select>
  `;
}

function saveSelectState(el) { localStorage.setItem('sel_' + el.id, el.value); }
function restoreSelects() {
  ['s-shift', 's-oper', 's-prod', 's-stat'].forEach(id => {
    const val = localStorage.getItem('sel_' + id);
    if(val) { const el = document.getElementById(id); if(el) el.value = val; }
  });
}

// --- 5. منطق تایمر ---
const Timer = {
  interval: null, startTime: 0, elapsed: 0, laps: [], running: false,

  start: (isContinuous = false) => {
    if(Timer.running) return;
    Timer.startTime = Date.now() - Timer.elapsed;
    Timer.interval = setInterval(() => {
      Timer.elapsed = Date.now() - Timer.startTime;
      updateDisplay(Timer.elapsed);
    }, 10);
    Timer.running = true;
    toggleBtns(true, isContinuous);
  },

  stop: () => { clearInterval(Timer.interval); Timer.running = false; toggleBtns(false, true); },

  record: () => {
    const sec = (Timer.elapsed / 1000).toFixed(2);
    Timer.laps.push(sec);
    const div = document.createElement('div');
    div.className = 'lap-item';
    div.innerHTML = `<span>دور ${Timer.laps.length}</span> <b>${sec}s</b>`;
    document.getElementById('laps-list').prepend(div);
    Timer.elapsed = 0; Timer.startTime = Date.now(); updateDisplay(0);
  },

  reset: () => { Timer.stop(); Timer.elapsed = 0; updateDisplay(0); },

  addContinuousCycle: () => {
    const countInput = document.getElementById('prod-count');
    const count = parseInt(countInput.value);
    if (!count || count <= 0) return Alert.error("تعداد تولید را وارد کنید");
    if (Timer.running) return Alert.error("ابتدا تایمر را متوقف کنید");
    if (Timer.elapsed === 0) return Alert.error("زمانی ثبت نشده است");

    const timeSec = parseFloat((Timer.elapsed / 1000).toFixed(2));
    tempContinuousData.push({ time: timeSec, count: count });

    const list = document.getElementById('cycle-list');
    const div = document.createElement('div');
    div.className = 'lap-item';
    div.style.borderLeftColor = '#fbbc04';
    div.innerHTML = `<span>سیکل ${tempContinuousData.length}</span> <span>⏱️ ${timeSec}s</span> <span>📦 ${count}</span>`;
    list.prepend(div);

    Timer.elapsed = 0; updateDisplay(0); countInput.value = '';
    document.getElementById('btn-final-send').disabled = false;
    Alert.success("سیکل افزوده شد");
  },

  finishContinuous: async () => {
    if (tempContinuousData.length === 0) return Alert.error("هیچ داده‌ای ثبت نشده است");
    const data = getFormData();
    if(!data) return;

    let totalTime = 0, totalCount = 0;
    tempContinuousData.forEach(item => { totalTime += item.time; totalCount += item.count; });
    const finalRate = (totalTime / totalCount).toFixed(2);

    saveData({ type: 'continuous', data: { ...data, totalTime: totalTime.toFixed(2), count: totalCount, rate: finalRate } });

    // ریست بدون رفرش
    tempContinuousData = [];
    document.getElementById('cycle-list').innerHTML = '';
    document.getElementById('btn-final-send').disabled = true;
    Timer.reset();
  },

  finishWorkstation: async () => {
    const data = getFormData();
    if(!data) return;
    if(Timer.laps.length === 0) return Alert.error("زمانی ثبت نشده است!");
    
    clearInterval(Timer.interval);
    saveData({ type: 'workstation', data: { ...data, times: Timer.laps } });
    
    // ریست بدون رفرش
    Timer.laps = []; Timer.elapsed = 0; Timer.running = false;
    document.getElementById('laps-list').innerHTML = '';
    updateDisplay(0);
    toggleBtns(false, false);
  }
};

function updateDisplay(ms) {
  const s = Math.floor(ms/1000); const m = Math.floor(s/60); const msShow = Math.floor((ms%1000)/10);
  document.getElementById('display').innerText = `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}.${String(msShow).padStart(2,'0')}`;
}

function toggleBtns(running, isCon) {
  if(isCon) {
    document.getElementById('btn-start').disabled = running;
    document.getElementById('btn-stop').disabled = !running;
  } else {
    document.getElementById('btn-start').disabled = running;
    document.getElementById('btn-rec').disabled = !running;
    document.getElementById('btn-save').disabled = !running;
  }
}

function getFormData() {
  const shift = document.getElementById('s-shift').value;
  if(!shift) { Alert.error("لطفا تمام فیلدها را انتخاب کنید"); return null; }
  return {
    shift,
    operator: document.getElementById('s-oper').value,
    product: document.getElementById('s-prod').value,
    station: document.getElementById('s-stat').value
  };
}

// --- 6. مدیریت داده و آفلاین (Batch) ---
function saveData(record) {
  record.id = Date.now();
  record.license = LICENSE;
  record.timestamp = new Date().toISOString();
  
  let q = JSON.parse(localStorage.getItem('queue') || '[]');
  q.push(record);
  localStorage.setItem('queue', JSON.stringify(q));
  
  // اطمینان از بسته بودن لودر قبل از سینک
  Loader.hide();
  
  syncData();
}

async function syncData(manual = false) {
  const statusEl = document.getElementById('offline-status');
  if(!navigator.onLine) { 
    if(statusEl) statusEl.innerText = `صف ارسال: ${getQueueLength()} (آفلاین)`;
    return; 
  }
  
  let q = JSON.parse(localStorage.getItem('queue') || '[]');
  if(q.length === 0) {
    if(statusEl) statusEl.innerText = "همگام‌سازی شده ✅";
    if(manual) Alert.success("همه داده‌ها قبلاً ارسال شده‌اند.");
    return;
  }

  // فقط اگر دستی باشد لودینگ نشان بده
  if(manual) Loader.show("در حال ارسال داده‌ها...");
  else if(statusEl) statusEl.innerText = "در حال ارسال...";
  
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ license: LICENSE, payload: q }),
      headers: { "Content-Type": "text/plain" }
    });
    const json = await res.json();
    
    if (json.status === 'maintenance') {
      UI.showMaintenance();
      return;
    }
    
    if(json.status === 'success') {
      localStorage.setItem('queue', '[]');
      if(statusEl) statusEl.innerText = "همگام‌سازی شده ✅";
      
      // تغییر مهم: حذف رفرش، فقط نمایش موفقیت و مخفی کردن لودینگ
      if(manual) { 
        Loader.hide();
        await Alert.success("ارسال موفقیت‌آمیز بود!");
        // بروزرسانی صف در UI
        document.getElementById('offline-status').innerText = `صف ارسال: 0`;
      }
    } else { throw new Error(json.message); }
  } catch(e) {
    if(manual) { Loader.hide(); Alert.error("خطا در ارسال: " + e.message); }
    if(statusEl) statusEl.innerText = "خطا در ارسال ❌";
  }
}

// --- 7. منطق اتصال (Setup Logic) ---
async function completeSetup() {
  const url = document.getElementById('sheet-url').value;
  if (!url.includes('docs.google.com')) return Alert.error("لینک فایل معتبر نیست!");

  Loader.show("در حال اتصال...");
  try {
    const res = await fetch(`${API_URL}?license=${LICENSE}&op=connect_sheet&sheet_url=${encodeURIComponent(url)}`);
    const json = await res.json();
    
    // FIX 1: مخفی کردن لودینگ قبل از نمایش آلرت موفقیت
    Loader.hide(); 

    if (json.status === 'maintenance') {
      UI.showMaintenance();
      return;
    }

    if (json.status === 'success') {
      await Alert.success("اتصال برقرار شد! سیستم آماده است.");
      // FIX 2: جایگزینی رفرش صفحه با راه‌اندازی مجدد منطقی
      init(); // فراخوانی مجدد تابع اولیه برای دریافت کانفیگ جدید
    } else {
      Alert.error(json.message);
    }
  } catch (e) { 
    Loader.hide(); 
    Alert.error("خطا در ارتباط: " + e.message); 
  }
}

async function init() {
  if (API_URL.includes("YOUR_SCRIPT_URL")) {
    Alert.error("لینک اسکریپت تنظیم نشده است!"); return;
  }

  const params = new URLSearchParams(location.search);
  const urlLic = params.get('license');
  if(urlLic) {
    LICENSE = urlLic.toUpperCase();
    localStorage.setItem('license', LICENSE);
  }

  if(!LICENSE) {
    document.body.innerHTML = `
      <div style="display:flex; height:100vh; justify-content:center; align-items:center; flex-direction:column; padding:20px; text-align:center;">
        <h2>🔑 ورود به سیستم</h2>
        <input id="l-in" placeholder="کد لایسنس شرکت" style="padding:15px; width:100%; max-width:280px; margin-bottom:15px; border-radius:10px; border:1px solid #ccc; font-family:inherit; text-align:center;">
        <button class="btn btn-primary" style="max-width:280px;" onclick="setLic()">تایید و ورود</button>
      </div>
    `;
    window.setLic = () => {
      const v = document.getElementById('l-in').value.trim().toUpperCase();
      if(v) { localStorage.setItem('license', v); location.href = '?license='+v; }
      else Alert.error("لطفاً کد را وارد کنید");
    };
    return;
  }

  Loader.show("دریافت تنظیمات...");
  try {
    if(navigator.onLine) {
      const res = await fetch(`${API_URL}?license=${LICENSE}`);
      const json = await res.json();
      
      if (json.status === 'maintenance') {
        UI.showMaintenance(json.message);
        return;
      }
      
      if (json.status === 'kill' || json.status === 'error') {
        UI.showErrorPage("دسترسی مسدود شد", json.message);
        return;
      }
      
      if (json.status === 'setup_required') {
        UI.showSetupWizard(json); 
        Loader.hide();
        return;
      }
      
      if (json.status === 'success') {
        CONFIG = json.data;
        localStorage.setItem('config', JSON.stringify(CONFIG));
        UI.renderHome();
      }
    } else {
      const cached = localStorage.getItem('config');
      if (cached) { 
        CONFIG = JSON.parse(cached); 
        UI.renderHome(); 
      } else { 
        UI.showErrorPage("اینترنت قطع است", "هیچ داده‌ای برای نمایش آفلاین وجود ندارد."); 
      }
    }
  } catch(e) { console.log("Offline config load"); }
  
  Loader.hide();
  syncData();
}

function logout() {
  Alert.confirm("آیا می‌خواهید خارج شوید؟").then(res => {
    if(res) { localStorage.clear(); location.href = location.pathname; }
  });
}

function getQueueLength() { return JSON.parse(localStorage.getItem('queue') || '[]').length; }

// شروع برنامه
init();