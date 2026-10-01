
(function(){
  'use strict';
  document.documentElement.classList.add('js');

  var header=document.querySelector('.site-header');
  window.addEventListener('scroll',function(){
    if(header){header.classList.toggle('scrolled',window.scrollY>10);}
  },{passive:true});

  var toggle=document.querySelector('.nav-toggle');
  var nav=document.querySelector('.main-nav');
  if(toggle&&nav){
    var openLabel=toggle.getAttribute('aria-label')||'פתיחת תפריט';
    function setMenu(open){
      nav.classList.toggle('open',open);
      toggle.setAttribute('aria-expanded',open?'true':'false');
      toggle.setAttribute('aria-label',open?'סגירת תפריט':openLabel);
      document.body.style.overflow=open?'hidden':'';
      // hides the floating buttons and the accessibility button behind the open menu
      document.body.classList.toggle('menu-open',open);
    }
    toggle.addEventListener('click',function(){
      setMenu(!nav.classList.contains('open'));
    });
    nav.querySelectorAll('a[href]').forEach(function(a){
      a.addEventListener('click',function(){setMenu(false);});
    });
    document.addEventListener('keydown',function(e){
      if(!nav.classList.contains('open'))return;
      if(e.key==='Escape'){
        setMenu(false);
        toggle.focus();
        return;
      }
      if(e.key==='Tab'){
        // keep focus inside the open menu (toggle button included)
        var items=[toggle].concat(Array.prototype.slice.call(nav.querySelectorAll('a[href]')));
        var first=items[0],last=items[items.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
        else if(items.indexOf(document.activeElement)===-1){e.preventDefault();first.focus();}
      }
    });
  }

  // sub-menu state for assistive tech (open on hover/focus is unchanged - CSS drives it)
  document.querySelectorAll('.has-sub').forEach(function(li){
    var a=li.querySelector(':scope>a'); if(!a)return;
    function set(v){a.setAttribute('aria-expanded',v?'true':'false');}
    set(false);
    li.addEventListener('focusin',function(){set(true);});
    li.addEventListener('focusout',function(){if(!li.contains(document.activeElement))set(false);});
    li.addEventListener('mouseenter',function(){set(true);});
    li.addEventListener('mouseleave',function(){if(!li.contains(document.activeElement))set(false);});
  });

  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}
      });
    },{threshold:0.12});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
  }else{
    document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('visible');});
  }

  // Analytics (GA4) - loads only after explicit consent (Privacy Protection Law, amendment 13).
  // Empty GA_ID = no analytics and no banner.
  var GA_ID='G-6LR256K0T0';
  var CONSENT_KEY='ri_consent',CONSENT_DAYS=365;
  var gaLoaded=false;
  function readConsent(){
    try{
      var v=(localStorage.getItem(CONSENT_KEY)||'').split('|');
      if((v[0]==='yes'||v[0]==='no')&&Date.now()-Number(v[1]||0)<CONSENT_DAYS*864e5){return v[0];}
    }catch(e){}
    return null;
  }
  function saveConsent(v){try{localStorage.setItem(CONSENT_KEY,v+'|'+Date.now());}catch(e){}}
  function loadGA(){
    if(gaLoaded||!GA_ID)return;
    gaLoaded=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('js',new Date());
    window.gtag('config',GA_ID);
    var sc=document.createElement('script');
    sc.async=true;sc.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_ID);
    document.head.appendChild(sc);
  }
  function clearGACookies(){
    var host=location.hostname.replace(/^www\./,'');
    document.cookie.split(';').forEach(function(c){
      var n=c.split('=')[0].trim();
      if(n==='_ga'||n.indexOf('_ga_')===0||n==='_gid'){
        ['',';domain='+host,';domain=.'+host].forEach(function(d){
          document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'+d;
        });
      }
    });
  }
  function track(name,params){
    if(gaLoaded&&window.gtag){window.gtag('event',name,params||{});}
  }
  function showBanner(){
    if(!GA_ID||document.getElementById('consent-banner'))return;
    var b=document.createElement('div');
    b.id='consent-banner';b.className='consent-banner';
    b.setAttribute('role','region');b.setAttribute('aria-label','הסכמה לעוגיות');
    var privacy=location.pathname.indexOf('/articles/')>-1?'../privacy.html':'privacy.html';
    if(!/\.html$/.test(location.pathname)){privacy='/privacy';}
    b.innerHTML='<p>נשמח למדוד את השימוש באתר באמצעות עוגיות של גוגל אנליטיקס, כדי לדעת אילו עמודים עוזרים לגולשים. המדידה תופעל רק אם תאשרו, ואפשר לשנות את הבחירה בכל עת. <a href="'+privacy+'">מדיניות הפרטיות</a></p>'+
      '<div class="consent-actions"><button type="button" class="consent-btn" data-consent="yes">אישור</button><button type="button" class="consent-btn" data-consent="no">דחייה</button></div>';
    document.body.appendChild(b);
    document.body.classList.add('consent-open');
    function fit(){document.body.style.setProperty('--consent-h',b.offsetHeight+'px');}
    fit();window.addEventListener('resize',fit);
    b.addEventListener('click',function(e){
      var v=e.target&&e.target.getAttribute&&e.target.getAttribute('data-consent');
      if(!v)return;
      saveConsent(v);
      if(v==='yes'){loadGA();}else{clearGACookies();}
      window.removeEventListener('resize',fit);
      b.parentNode.removeChild(b);
      document.body.classList.remove('consent-open');
      document.body.style.removeProperty('--consent-h');
    });
  }
  var consent=readConsent();
  if(consent==='yes'){loadGA();}else if(consent===null){showBanner();}
  // privacy page: change the choice
  document.querySelectorAll('[data-consent-reset]').forEach(function(btn){
    if(!GA_ID){btn.hidden=true;return;}
    btn.addEventListener('click',function(){
      try{localStorage.removeItem(CONSENT_KEY);}catch(e){}
      clearGACookies();
      showBanner();
      var first=document.querySelector('#consent-banner .consent-btn');if(first){first.focus();}
    });
  });
  // conversion events: phone and WhatsApp clicks anywhere on the site
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
    if(!a)return;
    var href=a.getAttribute('href')||'';
    if(href.indexOf('tel:')===0){track('phone_click',{link_url:href});}
    else if(href.indexOf('wa.me/')>-1){track('whatsapp_click',{link_url:href.split('?')[0]});}
  });

  // Israeli phone: 05X/07X (10 digits) or area codes 02/03/04/08/09 (9 digits); +972 accepted
  function phoneValid(phone){
    var digits=String(phone).replace(/\D/g,'');
    if(digits.indexOf('972')===0){digits='0'+digits.slice(3);}
    return /^0(5\d|7\d)\d{7}$/.test(digits)||/^0[23489]\d{7}$/.test(digits);
  }

  // contact form -> WhatsApp handoff with validation + honeypot
  var form=document.getElementById('contact-form');
  if(form){
    form.addEventListener('submit',function(ev){
      ev.preventDefault();
      var status=document.getElementById('form-status');
      var hp=form.querySelector('[name="ri_extra"]');
      if(hp&&hp.value){return;} // bot trap
      var nameField=form.querySelector('[name="fullname"]');
      var phoneField=form.querySelector('[name="phone"]');
      var name=(nameField.value||'').trim();
      var phone=(phoneField.value||'').trim();
      var topic=(form.querySelector('[name="topic"]')||{}).value||'';
      var msg=(form.querySelector('[name="message"]').value||'').trim();
      var phoneOk=phoneValid(phone);
      var invalid=[];
      if(name.length<2)invalid.push(nameField);
      if(!phoneOk)invalid.push(phoneField);
      [nameField,phoneField].forEach(function(f){
        if(invalid.indexOf(f)>-1){
          f.setAttribute('aria-invalid','true');
          f.setAttribute('aria-describedby','form-status');
        }else{
          f.removeAttribute('aria-invalid');
          f.removeAttribute('aria-describedby');
        }
      });
      if(invalid.length){
        if(status){status.className='form-status err';status.textContent='נא למלא שם מלא ומספר טלפון ישראלי תקין.';}
        invalid[0].focus();
        return;
      }
      var text='שלום, אשמח לקבוע שיחת ייעוץ.'+'\n'+'שם: '+name+'\n'+'טלפון: '+phone;
      if(topic){text+='\n'+'תחום: '+topic;}
      if(msg){text+='\n'+'פרטים: '+msg;}
      var waUrl='https://wa.me/972545333897?text='+encodeURIComponent(text);
      function whatsappHandoff(){
        if(status){status.className='form-status ok';status.textContent='נפתח עבורכם חלון וואטסאפ להשלמת הפנייה.';}
        track('whatsapp_click',{link_url:'https://wa.me/972545333897',source:'contact_form'});
        window.open(waUrl,'_blank','noopener');
        form.reset();
      }
      // Email delivery: the hosting platform's form service (form marked data-netlify), or the form relay (data-key).
      // Without either, or on any failure: WhatsApp handoff.
      var key=form.getAttribute('data-key')||'';
      // (the hosting platform strips data-netlify at deploy time and keeps the hidden form-name field)
      var hosted=form.hasAttribute('data-netlify')||!!form.querySelector('input[name="form-name"]');
      if((!key&&!hosted)||!window.fetch){whatsappHandoff();return;}
      var btn=form.querySelector('button[type="submit"]');
      if(btn){btn.disabled=true;}
      if(status){status.className='form-status ok';status.textContent='שולח את הפנייה...';}
      if(hosted){
        var params=new URLSearchParams();
        params.append('form-name',form.getAttribute('name')||'contact');
        params.append('fullname',name);params.append('phone',phone);params.append('topic',topic);params.append('message',msg);
        params.append('ri_extra',hp?hp.value:'');
        fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params.toString()})
          .then(function(r){
            if(btn){btn.disabled=false;}
            if(r.ok){
              if(status){status.className='form-status ok';status.textContent='הפנייה נשלחה למשרד. נחזור אליכם בשעות הפעילות.';}
              track('form_submit',{form_name:'contact'});
              form.reset();
            }else{whatsappHandoff();}
          }).catch(function(){if(btn){btn.disabled=false;}whatsappHandoff();});
        return;
      }
      fetch('https://api.web3forms.com/submit',{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({
          access_key:key,
          subject:'פנייה חדשה מאתר המשרד'+(topic?' - '+topic:''),
          from_name:'אתר רישטלר - עורכי דין',
          'שם':name,'טלפון':phone,'תחום':topic||'-','תוכן הפנייה':msg||'-',
          botcheck:hp?hp.value:''
        })
      }).then(function(r){return r.json();}).then(function(j){
        if(btn){btn.disabled=false;}
        if(j&&j.success){
          if(status){status.className='form-status ok';status.textContent='הפנייה נשלחה למשרד. נחזור אליכם בשעות הפעילות.';}
              track('form_submit',{form_name:'contact'});
          form.reset();
        }else{
          whatsappHandoff();
        }
      }).catch(function(){
        if(btn){btn.disabled=false;}
        whatsappHandoff();
      });
    });
  }
})();
