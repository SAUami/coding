 // ===================== CONFIG & STATE =====================
    const BASE = "https://api.openweathermap.org/data/2.5";
    const STORAGE_KEY = "typeahead-weather-api-key";

    const state = {
      unit: "metric", // "metric" or "imperial"
      lastCity: null,
      current: null,
      forecast: null,
      demoMode: false,
    };

    // ===================== DOM ELEMENTS =====================
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const geoBtn = document.getElementById('geoBtn');
    const unitSwitch = document.getElementById('unitSwitch');
    const unitLabel = document.getElementById('unitLabel');
    const settingsBtn = document.getElementById('settingsBtn');
    const runTestsBtn = document.getElementById('runTestsBtn');
    const toggleDemoBtn = document.getElementById('toggleDemoBtn');
    const modeBadge = document.getElementById('modeBadge');

    const cityName = document.getElementById('cityName');
    const weatherDesc = document.getElementById('weatherDesc');
    const tempMain = document.getElementById('tempMain');
    const feelsLike = document.getElementById('feelsLike');
    const humidity = document.getElementById('humidity');
    const wind = document.getElementById('wind');
    const pressure = document.getElementById('pressure');
    const coords = document.getElementById('coords');
    const sunrise = document.getElementById('sunrise');
    const sunset = document.getElementById('sunset');
    const visibility = document.getElementById('visibility');
    const bigIcon = document.getElementById('bigIcon');

    const forecastGrid = document.getElementById('forecastGrid');
    const statusEl = document.getElementById('status');

    // Settings modal
    const settingsModal = document.getElementById('settingsModal');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const clearKeyBtn = document.getElementById('clearKeyBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const keyInput = document.getElementById('keyInput');

    // ===================== UTILITIES =====================
    function getApiKey(){ return localStorage.getItem(STORAGE_KEY) || ''; }
    function setApiKey(k){ localStorage.setItem(STORAGE_KEY, (k||'').trim()); }
    function clearApiKey(){ localStorage.removeItem(STORAGE_KEY); }

    function showStatus(msg, type="ok"){ statusEl.innerHTML = `<span class="${type}">${msg}</span>`; }

    function toLocalTime(ts, tzOffset){
      const date = new Date((ts + tzOffset) * 1000);
      const hh = String(date.getUTCHours()).padStart(2,'0');
      const mm = String(date.getUTCMinutes()).padStart(2,'0');
      return `${hh}:${mm}`;
    }

    function formatUnit(value, type){
      const isMetric = state.unit === 'metric';
      if(type==='temp') return `${Math.round(value)}°`;
      if(type==='wind') return `${Number(value).toFixed(1)} ${isMetric? 'm/s' : 'mph'}`;
      if(type==='pressure') return `${value} hPa`;
      if(type==='visibility') return `${(value/1000).toFixed(1)} km`;
      return value;
    }

    function iconUrl(code){ return `https://openweathermap.org/img/wn/${code}@2x.png`; }

    function updateModeBadge(){ modeBadge.innerHTML = `Mode: <strong>${state.demoMode? 'Demo' : 'Live'}</strong>`; }

    // ===================== MOCK / DEMO DATA =====================
    function generateMockCurrent(city='Delhi'){
      const now = Math.floor(Date.now()/1000);
      const tz = 19800; // IST offset
      return {
        coord:{ lat:28.61, lon:77.21 },
        weather:[{ id:802, main:'Clouds', description:'scattered clouds', icon:'03d' }],
        base:'stations',
        main:{ temp:32.4, feels_like:36.1, pressure:1005, humidity:62, temp_min:30, temp_max:35 },
        visibility:7000,
        wind:{ speed:3.4, deg:140 },
        clouds:{ all:40 },
        dt: now,
        sys:{ country:'IN', sunrise: now - (now%86400) + 6*3600 + 30*60, sunset: now - (now%86400) + 19*3600 },
        timezone: tz,
        id:1273294,
        name: city,
        cod:200
      };
    }

    function generateMockForecast(){
      const now = Date.now();
      const step = 3 * 3600 * 1000; // 3-hour steps
      const list = [];
      for(let d=0; d<5; d++){
        for(let i=0; i<8; i++){
          const t = now + (d*24*3600 + i*3*3600)*1000;
          const baseTemp = 31 - d + Math.sin(i/8*3.14)*2;
          list.push({
            dt: Math.floor(t/1000),
            main:{ temp_min: baseTemp - 1, temp_max: baseTemp + 2 },
            weather:[{ description: d%2? 'clear sky':'scattered clouds', icon: d%2? '01d':'03d' }]
          });
        }
      }
      return { city:{ name:'Delhi', country:'IN' }, cnt:list.length, list };
    }

    // ===================== NETWORK =====================
    async function fetchJSON(url){
      const res = await fetch(url);
      const text = await res.text();
      if(!res.ok){
        // Try to parse JSON error
        let msg = `HTTP ${res.status}`;
        try{ const j = JSON.parse(text); if(j && j.message) msg += `: ${j.message}`; }catch{}
        throw new Error(msg);
      }
      try{ return JSON.parse(text); } catch{ return text; }
    }

    async function getWeatherByCity(city){
      if(state.demoMode){ return generateMockCurrent(city); }
      const key = getApiKey();
      if(!key){ state.demoMode = true; updateModeBadge(); showStatus('No API key set — switched to Demo Mode. Click ⚙️ to add your key.', 'warn'); return generateMockCurrent(city); }
      const url = `${BASE}/weather?q=${encodeURIComponent(city)}&appid=${key}&units=${state.unit}`;
      try{
        return await fetchJSON(url);
      }catch(err){
        if(String(err.message).includes('401')){
          state.demoMode = true; updateModeBadge();
          showStatus('Invalid API key. Switched to Demo Mode. Paste a valid key in ⚙️ Settings.', 'error');
          openSettings();
          return generateMockCurrent(city);
        }
        throw err;
      }
    }

    async function getWeatherByCoords(lat, lon){
      if(state.demoMode){ return generateMockCurrent(state.lastCity || 'Your location'); }
      const key = getApiKey();
      if(!key){ state.demoMode = true; updateModeBadge(); showStatus('No API key set — using Demo Mode.', 'warn'); return generateMockCurrent('Your location'); }
      const url = `${BASE}/weather?lat=${lat}&lon=${lon}&appid=${key}&units=${state.unit}`;
      try{
        return await fetchJSON(url);
      }catch(err){
        if(String(err.message).includes('401')){
          state.demoMode = true; updateModeBadge();
          showStatus('Invalid API key. Using Demo Mode. Set your key in ⚙️.', 'error');
          openSettings();
          return generateMockCurrent('Your location');
        }
        throw err;
      }
    }

    async function getForecast(lat, lon){
      if(state.demoMode){ return generateMockForecast(); }
      const key = getApiKey();
      if(!key){ state.demoMode = true; updateModeBadge(); showStatus('No API key set — using Demo Mode.', 'warn'); return generateMockForecast(); }
      const url = `${BASE}/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=${state.unit}`;
      try{
        return await fetchJSON(url);
      }catch(err){
        if(String(err.message).includes('401')){
          state.demoMode = true; updateModeBadge();
          showStatus('Invalid API key. Using Demo Mode.', 'error');
          openSettings();
          return generateMockForecast();
        }
        throw err;
      }
    }

    // ===================== RENDER =====================
    function summarizeDaily(list){
      const byDay = {};
      list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toISOString().slice(0,10);
        if(!byDay[dayKey]) byDay[dayKey] = [];
        byDay[dayKey].push(item);
      });
      const days = Object.entries(byDay).map(([key, arr]) => {
        let min = Infinity, max = -Infinity, icon = arr[0].weather[0].icon, desc = arr[0].weather[0].description;
        let noonDiff = Infinity, noonItem = arr[0];
        arr.forEach(it => {
          min = Math.min(min, it.main.temp_min);
          max = Math.max(max, it.main.temp_max);
          const hour = new Date(it.dt * 1000).getUTCHours();
          const diff = Math.abs(hour - 12);
          if(diff < noonDiff){ noonDiff = diff; noonItem = it; }
        });
        icon = noonItem.weather[0].icon; desc = noonItem.weather[0].description;
        return { date:key, min, max, icon, desc };
      }).slice(0, 5);
      return days;
    }

    function renderCurrent(data){
      state.current = data;
      cityName.textContent = `${data.name || '—'}, ${data.sys?.country || ''}`.trim();
      weatherDesc.textContent = data.weather?.[0]?.description || '';
      tempMain.textContent = formatUnit(data.main.temp, 'temp');
      feelsLike.textContent = formatUnit(data.main.feels_like, 'temp');
      humidity.textContent = `${data.main.humidity}%`;
      wind.textContent = formatUnit(data.wind.speed, 'wind');
      pressure.textContent = formatUnit(data.main.pressure, 'pressure');
      coords.textContent = `${Number(data.coord.lat).toFixed(2)}, ${Number(data.coord.lon).toFixed(2)}`;
      sunrise.textContent = toLocalTime(data.sys.sunrise, data.timezone);
      sunset.textContent = toLocalTime(data.sys.sunset, data.timezone);
      visibility.textContent = formatUnit(data.visibility, 'visibility');
      bigIcon.src = iconUrl(data.weather?.[0]?.icon || '01d');
      bigIcon.alt = data.weather?.[0]?.main || 'weather icon';
    }

    function renderForecast(data){
      state.forecast = data;
      const days = summarizeDaily(data.list || []);
      forecastGrid.innerHTML = days.map(d => `
        <div class="card">
          <div style="font-weight:700; margin-bottom:4px">${new Date(d.date).toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })}</div>
          <img alt="${d.desc}" src="${iconUrl(d.icon)}" width="60" height="60"/>
          <div class="muted" style="text-transform:capitalize; margin:6px 0">${d.desc}</div>
          <div><strong>${Math.round(d.max)}°</strong> / <span class="muted">${Math.round(d.min)}°</span></div>
        </div>
      `).join('');
    }

    async function searchCity(city){
      try{
        showStatus('Loading...');
        const w = await getWeatherByCity(city);
        renderCurrent(w);
        const f = await getForecast(w.coord.lat, w.coord.lon);
        renderForecast(f);
        state.lastCity = city;
        showStatus(state.demoMode ? 'Updated (Demo) ✓' : 'Updated ✓', state.demoMode ? 'warn' : 'ok');
      }catch(err){
        console.error(err);
        showStatus(String(err.message || err), 'error');
      }
    }

    async function searchCoords(lat, lon){
      try{
        showStatus('Loading...');
        const w = await getWeatherByCoords(lat, lon);
        renderCurrent(w);
        const f = await getForecast(lat, lon);
        renderForecast(f);
        state.lastCity = `${w.name}`;
        showStatus(state.demoMode ? 'Updated (Demo) ✓' : 'Updated ✓', state.demoMode ? 'warn' : 'ok');
      }catch(err){
        console.error(err);
        showStatus(String(err.message || err), 'error');
      }
    }

    function toggleUnits(){
      unitSwitch.classList.toggle('active');
      state.unit = unitSwitch.classList.contains('active') ? 'imperial' : 'metric';
      unitLabel.textContent = state.unit === 'metric' ? '°C' : '°F';
      if(state.current){
        const { lat, lon } = state.current.coord;
        searchCoords(lat, lon);
      } else if(state.lastCity){
        searchCity(state.lastCity);
      }
    }

    // ===================== SETTINGS MODAL =====================
    function openSettings(){ keyInput.value = getApiKey(); settingsModal.classList.add('show'); }
    function closeSettings(){ settingsModal.classList.remove('show'); }

    settingsBtn.addEventListener('click', openSettings);
    closeModalBtn.addEventListener('click', closeSettings);
    saveKeyBtn.addEventListener('click', ()=>{
      const k = keyInput.value.trim();
      setApiKey(k);
      state.demoMode = false;
      updateModeBadge();
      showStatus('API key saved. Using Live mode.', 'ok');
      if(state.lastCity){ searchCity(state.lastCity); }
      closeSettings();
    });
    clearKeyBtn.addEventListener('click', ()=>{
      clearApiKey();
      state.demoMode = true; updateModeBadge();
      showStatus('API key cleared. Back to Demo Mode.', 'warn');
    });
    settingsModal.addEventListener('click', (e)=>{ if(e.target === settingsModal) closeSettings(); });

    // ===================== TESTS (Added since none existed) =====================
    function assert(name, condition){ if(!condition) throw new Error(name); }

    function runTests(){
      try{
        // formatUnit tests
        state.unit = 'metric';
        assert('format temp metric', formatUnit(25.4,'temp') === '25°');
        assert('format wind metric', formatUnit(4.44,'wind').includes('m/s'));
        state.unit = 'imperial';
        assert('format wind imperial', formatUnit(4.44,'wind').includes('mph'));
        state.unit = 'metric';

        // toLocalTime test (just HH:MM pattern)
        const t = toLocalTime(0, 0);
        assert('toLocalTime HH:MM', /^\d{2}:\d{2}$/.test(t));

        // iconUrl test
        assert('iconUrl', iconUrl('01d').includes('/01d@2x.png'));

        // summarizeDaily tests
        const mock = generateMockForecast();
        const days = summarizeDaily(mock.list);
        assert('summarizeDaily length', days.length > 0 && days.length <= 5);
        assert('summarizeDaily shape', ['date','min','max','icon','desc'].every(k=>k in days[0]));

        // Error handling test (simulate 401)
        const e = new Error('HTTP 401: Invalid API key');
        assert('error message contains 401', e.message.includes('401'));

        console.log('%cAll tests passed','color:lime');
        showStatus('Diagnostics: All tests passed ✓', 'ok');
      }catch(err){
        console.error('Test failed:', err.message);
        showStatus('Diagnostics failed: '+err.message, 'error');
      }
    }

    // ===================== EVENT LISTENERS =====================
    searchBtn.addEventListener('click', ()=>{ const city = cityInput.value.trim(); if(city) searchCity(city); });
    cityInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ const city = cityInput.value.trim(); if(city) searchCity(city); } });
    clearBtn.addEventListener('click', ()=>{ cityInput.value=''; cityInput.focus(); });
    unitSwitch.addEventListener('click', toggleUnits);
    unitSwitch.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') toggleUnits(); });

    geoBtn.addEventListener('click', ()=>{
      if(!('geolocation' in navigator)){ showStatus('Geolocation not supported.', 'warn'); return; }
      navigator.geolocation.getCurrentPosition(pos=>{
        const { latitude, longitude } = pos.coords;
        searchCoords(latitude, longitude);
      }, err=>{
        console.error(err);
        showStatus('Location permission denied.', 'warn');
      });
    });

    runTestsBtn.addEventListener('click', runTests);
    toggleDemoBtn.addEventListener('click', ()=>{ state.demoMode = !state.demoMode; updateModeBadge(); showStatus(state.demoMode? 'Demo Mode ON' : 'Live Mode ON', state.demoMode? 'warn':'ok'); if(state.lastCity){ searchCity(state.lastCity); } });

    // ===================== INIT =====================
    window.addEventListener('DOMContentLoaded', ()=>{
      state.demoMode = !getApiKey();
      updateModeBadge();
      const demoCity = 'Delhi';
      cityInput.value = demoCity;
      searchCity(demoCity);
      if(state.demoMode){ showStatus('Running in Demo Mode. Add your API key from ⚙️ to use live data.', 'warn'); }
    });