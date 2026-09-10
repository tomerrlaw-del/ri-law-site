/* תוסף נגישות - בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013 ות"י 5568 (WCAG 2.1 AA) */
(function(){
  'use strict';
  var KEY='a11y-settings';
  var root=document.documentElement;
  var state={text:0,dark:false,light:false,gray:false,links:false,font:false,motion:false,cursor:false,focus:false};

  try{
    var saved=JSON.parse(localStorage.getItem(KEY)||'{}');
    if(!saved||typeof saved!=='object')saved={};
    // validate types: a malformed stored value must not disable the widget
    for(var k in state){
      if(!(k in saved))continue;
      if(k==='text'){var n=parseInt(saved[k],10);state.text=(n>=0&&n<=4)?n:0;}
      else state[k]=saved[k]===true;
    }
  }catch(e){}

  var CURSOR_SVG='url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 24 24%22><path d=%22M4 2l16 11.5-6.5 1L17 21l-3 1.5-3.5-6.5L6 20z%22 fill=%22black%22 stroke=%22white%22 stroke-width=%221.5%22/></svg>") 4 2, auto';

  var css=[
  'html.acc-text-1{font-size:112.5%}',
  'html.acc-text-2{font-size:125%}',
  'html.acc-text-3{font-size:137.5%}',
  'html.acc-text-4{font-size:150%}',
  'html.acc-dark{filter:invert(1) hue-rotate(180deg);background:#111}',
  'html.acc-dark img,html.acc-dark video,html.acc-dark iframe,html.acc-dark .acc-widget,html.acc-dark .acc-panel{filter:invert(1) hue-rotate(180deg)}',
  /* filters sit on html so fixed elements keep their position */
  'html.acc-light{filter:contrast(1.25) saturate(1.15)}',
  'html.acc-gray{filter:grayscale(1)}',
  'html.acc-light.acc-gray{filter:grayscale(1) contrast(1.25)}',
  'html.acc-links a{text-decoration:underline !important;outline:1px dashed currentColor;outline-offset:2px}',
  'html.acc-links main a,html.acc-links footer a{background:#fff3bf !important;color:#16181d !important}',
  'html.acc-font body,html.acc-font h1,html.acc-font h2,html.acc-font h3,html.acc-font h4,html.acc-font .logo-name{font-family:Arial,Helvetica,sans-serif !important}',
  'html.acc-motion *,html.acc-motion *::before,html.acc-motion *::after{animation:none !important;transition:none !important;scroll-behavior:auto !important}',
  'html.acc-motion .reveal{opacity:1 !important;transform:none !important}',
  'html.acc-cursor,html.acc-cursor *{cursor:'+CURSOR_SVG+' !important}',
  'html.acc-focus a:focus,html.acc-focus button:focus,html.acc-focus input:focus,html.acc-focus select:focus,html.acc-focus textarea:focus,html.acc-focus summary:focus{outline:4px solid #d32f2f !important;outline-offset:3px !important}',
  /* widget */
  '.acc-widget{position:fixed;top:calc(50% - 26px);right:0;z-index:99999;font-family:Arial,Helvetica,sans-serif}',
  '.acc-btn{width:52px;height:52px;border:none;border-radius:12px 0 0 12px;background:#16181d;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.3)}',
  '.acc-btn:hover{background:#22262e}',
  '.acc-btn:focus{outline:3px solid #cbb58a;outline-offset:2px}',
  '.acc-btn svg{width:30px;height:30px;fill:#fff}',
  '.acc-panel{position:fixed;top:50%;right:60px;transform:translateY(-50%);width:300px;max-width:calc(100vw - 76px);max-height:82vh;overflow-y:auto;background:#fff;color:#1d2b3f;border:1px solid #d8d2c4;border-radius:14px;box-shadow:0 14px 44px rgba(0,0,0,.28);padding:18px;display:none;direction:rtl;text-align:right;z-index:99999;font-family:Arial,Helvetica,sans-serif}',
  '.acc-panel.open{display:block}',
  '.acc-title{font-size:1.05rem;font-weight:700;margin:0 0 4px;color:#16181d}',
  '.acc-panel .acc-sub{font-size:.78rem;color:#54637a;margin:0 0 12px}',
  '.acc-row{display:flex;gap:8px;margin-bottom:10px}',
  '.acc-opt{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 6px;border:1.5px solid #d8d2c4;border-radius:9px;background:#faf8f3;color:#1d2b3f;cursor:pointer;font-size:.82rem;font-weight:700;line-height:1.25;text-align:center}',
  '.acc-opt:hover{border-color:#b39a6a}',
  '.acc-opt:focus{outline:3px solid #16181d;outline-offset:1px}',
  '.acc-opt[aria-pressed="true"]{background:#16181d;color:#fff;border-color:#16181d}',
  '.acc-opt[disabled]{opacity:.45;cursor:default}',
  '.acc-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}',
  '.acc-reset{width:100%;padding:10px;border:none;border-radius:9px;background:#b3261e;color:#fff;font-weight:700;cursor:pointer;font-size:.88rem;margin-top:2px}',
  '.acc-reset:focus{outline:3px solid #16181d;outline-offset:2px}',
  '.acc-link{display:block;text-align:center;margin-top:10px;font-size:.82rem;color:#22262e;text-decoration:underline}',
  '.acc-close{position:absolute;top:10px;left:10px;width:30px;height:30px;border:none;border-radius:50%;background:#eee;cursor:pointer;font-size:1rem;font-weight:700;color:#333}',
  '.acc-close:focus{outline:3px solid #16181d}',
  /* narrow screens: the button moves to the bottom-right corner so it does not cover the start of text lines (RTL) */
  '@media(max-width:480px){.acc-widget{top:auto;bottom:88px;right:12px}.acc-btn{border-radius:12px}.acc-panel{right:8px;left:8px;width:auto;max-width:none;top:auto;bottom:12px;transform:none;max-height:70vh}}'
  ].join('\n');

  var styleEl=document.createElement('style');
  styleEl.id='acc-style';
  styleEl.textContent=css;
  document.head.appendChild(styleEl);

  function apply(){
    ['acc-text-1','acc-text-2','acc-text-3','acc-text-4'].forEach(function(c){root.classList.remove(c);});
    if(state.text>0)root.classList.add('acc-text-'+state.text);
    root.classList.toggle('acc-dark',state.dark);
    root.classList.toggle('acc-light',state.light);
    root.classList.toggle('acc-gray',state.gray);
    root.classList.toggle('acc-links',state.links);
    root.classList.toggle('acc-font',state.font);
    root.classList.toggle('acc-motion',state.motion);
    root.classList.toggle('acc-cursor',state.cursor);
    root.classList.toggle('acc-focus',state.focus);
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
    sync();
  }

  // build widget (panel lives on body so fixed position is against the viewport)
  var wrap=document.createElement('div');
  wrap.className='acc-widget';
  wrap.innerHTML=
    '<button type="button" class="acc-btn" aria-label="פתיחת תפריט נגישות" aria-expanded="false" aria-controls="acc-panel">'+
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm9 5h-6.2c-.5 0-1-.2-1.4-.5L12 5.5l-1.4 1c-.4.3-.9.5-1.4.5H3v2h5.4l-1.9 8.6c-.1.6.3 1.2.9 1.3.6.1 1.1-.3 1.3-.9l1.2-5h4.2l1.2 5c.1.6.7 1 1.3.9.6-.1 1-.7.9-1.3L15.6 9H21V7z"/></svg>'+
    '</button>';
  var panel=document.createElement('div');
  panel.className='acc-panel';
  panel.id='acc-panel';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','הגדרות נגישות');
  panel.innerHTML=
    '<button type="button" class="acc-close" aria-label="סגירת תפריט נגישות">&times;</button>'+
    '<div class="acc-title">הגדרות נגישות</div>'+
    '<p class="acc-sub">ההעדפות נשמרות בדפדפן שלך לביקורים הבאים</p>'+
    '<div class="acc-row">'+
      '<button type="button" class="acc-opt" data-act="text-up">הגדלת טקסט +</button>'+
      '<button type="button" class="acc-opt" data-act="text-down">הקטנת טקסט -</button>'+
    '</div>'+
    '<div class="acc-grid">'+
      '<button type="button" class="acc-opt" data-tog="dark">ניגודיות כהה</button>'+
      '<button type="button" class="acc-opt" data-tog="light">ניגודיות מוגברת</button>'+
      '<button type="button" class="acc-opt" data-tog="gray">גווני אפור</button>'+
      '<button type="button" class="acc-opt" data-tog="links">הדגשת קישורים</button>'+
      '<button type="button" class="acc-opt" data-tog="font">גופן קריא</button>'+
      '<button type="button" class="acc-opt" data-tog="motion">עצירת אנימציות</button>'+
      '<button type="button" class="acc-opt" data-tog="cursor">סמן גדול</button>'+
      '<button type="button" class="acc-opt" data-tog="focus">הדגשת מיקוד</button>'+
    '</div>'+
    '<button type="button" class="acc-reset">איפוס הגדרות נגישות</button>'+
    '<a class="acc-link" href="/accessibility/">להצהרת הנגישות המלאה</a>';
  document.body.appendChild(wrap);
  document.body.appendChild(panel);

  // static build (.html in the address): relative link that works from articles/ too; WordPress: fixed address
  var link=panel.querySelector('.acc-link');
  if(/\.html$/.test(location.pathname)){
    link.setAttribute('href','/accessibility');
  }else{
    link.setAttribute('href','/accessibility');
  }

  var btn=wrap.querySelector('.acc-btn');
  var closeBtn=panel.querySelector('.acc-close');

  function setOpen(open){
    panel.classList.toggle('open',open);
    btn.setAttribute('aria-expanded',open?'true':'false');
    if(open)panel.querySelector('.acc-opt').focus();
  }
  btn.addEventListener('click',function(){setOpen(!panel.classList.contains('open'));});
  closeBtn.addEventListener('click',function(){setOpen(false);btn.focus();});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&panel.classList.contains('open')){setOpen(false);btn.focus();}
  });
  document.addEventListener('click',function(e){
    if(panel.classList.contains('open')&&!wrap.contains(e.target)&&!panel.contains(e.target))setOpen(false);
  });
  // keep keyboard focus inside the dialog while it is open
  panel.addEventListener('keydown',function(e){
    if(e.key!=='Tab')return;
    var items=panel.querySelectorAll('button:not([disabled]),a[href]');
    if(!items.length)return;
    var first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });

  function sync(){
    panel.querySelectorAll('[data-tog]').forEach(function(b){
      b.setAttribute('aria-pressed',state[b.getAttribute('data-tog')]?'true':'false');
    });
    var up=panel.querySelector('[data-act="text-up"]');
    var down=panel.querySelector('[data-act="text-down"]');
    up.disabled=state.text>=4; down.disabled=state.text<=0;
    up.setAttribute('aria-label','הגדלת טקסט, רמה נוכחית '+state.text+' מתוך 4');
    down.setAttribute('aria-label','הקטנת טקסט, רמה נוכחית '+state.text+' מתוך 4');
  }

  panel.addEventListener('click',function(e){
    var t=e.target.closest('button'); if(!t)return;
    var tog=t.getAttribute('data-tog');
    var act=t.getAttribute('data-act');
    if(tog){
      state[tog]=!state[tog];
      if(tog==='dark'&&state.dark){state.light=false;state.gray=false;}
      if((tog==='light'||tog==='gray')&&state[tog]){state.dark=false;}
      apply();
    }else if(act==='text-up'&&state.text<4){state.text++;apply();}
    else if(act==='text-down'&&state.text>0){state.text--;apply();}
    else if(t.classList.contains('acc-reset')){
      for(var k in state)state[k]=(k==='text'?0:false);
      apply();
    }
  });

  apply();
})();
