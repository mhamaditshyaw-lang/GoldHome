#!/usr/bin/env node
(async ()=>{
  try {
    const res = await fetch('http://127.0.0.1:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    console.log('status', res.status);
    const text = await res.text();
    console.log('body', text);
  } catch (e) {
    console.error('request failed', e.message || e);
  }
})();
