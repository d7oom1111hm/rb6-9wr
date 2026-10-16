/* =====================================================
   نظام الأصوات المولّدة — بدون ملفات صوتية
   ===================================================== */
(function(){
  let ctx = null;
  let enabled = true;

  // قراءة تفضيل المستخدم
  try{
    const saved = localStorage.getItem("quiz_sound_enabled");
    if(saved !== null) enabled = saved === "true";
  }catch(e){}

  // إنشاء سياق الصوت (لازم بعد أول تفاعل من المستخدم)
  function getCtx(){
    if(!ctx){
      try{
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      }catch(e){
        console.warn("Web Audio API غير مدعوم:", e);
        return null;
      }
    }
    if(ctx.state === "suspended"){ ctx.resume().catch(()=>{}); }
    return ctx;
  }

  // تشغيل نغمة بسيطة
  function tone(freq, duration, type, vol, startTime){
    const c = getCtx();
    if(!c) return;
    const t = (startTime !== undefined ? startTime : c.currentTime);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol || 0.15, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  // أصوات جاهزة
  const SOUNDS = {
    // نقرة خفيفة عند الضغط على زر
    click(){
      tone(650, 0.08, "sine", 0.10);
    },
    // فتح صورة
    reveal(){
      tone(500, 0.10, "sine", 0.12);
      tone(750, 0.12, "sine", 0.10, getCtx()?.currentTime + 0.06);
    },
    // نجاح — صوت صاعد
    success(){
      const c = getCtx(); if(!c) return;
      tone(523, 0.15, "sine", 0.15);  // C5
      tone(659, 0.15, "sine", 0.15, c.currentTime + 0.10);  // E5
      tone(784, 0.25, "sine", 0.15, c.currentTime + 0.20);  // G5
    },
    // فشل — صوت هابط
    fail(){
      const c = getCtx(); if(!c) return;
      tone(400, 0.15, "sawtooth", 0.08);
      tone(300, 0.20, "sawtooth", 0.08, c.currentTime + 0.12);
    },
    // تيك التايمر (آخر 5 ثواني)
    tick(){
      tone(1200, 0.04, "square", 0.06);
    },
    // عد تنازلي 3، 2، 1
    count(){
      tone(800, 0.15, "sine", 0.15);
    },
    // بداية "يلا"
    go(){
      const c = getCtx(); if(!c) return;
      tone(600, 0.10, "sine", 0.18);
      tone(900, 0.20, "sine", 0.18, c.currentTime + 0.08);
    },
    // فوز نهائي — لحن احتفالي
    win(){
      const c = getCtx(); if(!c) return;
      const notes = [523, 659, 784, 1047];  // C-E-G-C
      notes.forEach((f, i) => {
        tone(f, 0.25, "sine", 0.18, c.currentTime + i * 0.13);
      });
    }
  };

  // الواجهة العامة
  window.SFX = {
    play(name){
      if(!enabled) return;
      const fn = SOUNDS[name];
      if(fn){ try{ fn(); }catch(e){} }
    },
    isEnabled(){ return enabled; },
    toggle(){
      enabled = !enabled;
      try{ localStorage.setItem("quiz_sound_enabled", enabled); }catch(e){}
      if(enabled) this.play("click");
      return enabled;
    },
    // لتفعيل الصوت من أول تفاعل
    unlock(){
      const c = getCtx();
      if(c && c.state === "suspended"){ c.resume().catch(()=>{}); }
    }
  };

  // تفعيل الصوت من أول نقرة بأي مكان
  document.addEventListener("click", function once(){
    window.SFX.unlock();
    document.removeEventListener("click", once);
  }, { once: true });
})();