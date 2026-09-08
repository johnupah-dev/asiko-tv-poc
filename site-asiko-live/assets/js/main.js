// ASIKO TV — shared site behaviour
(function(){
  // mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      links.classList.toggle('open');
      toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        links.classList.remove('open');
        toggle.textContent = '☰';
      });
    });
  }

  // footer year
  document.querySelectorAll('[data-year]').forEach(function(el){
    el.textContent = new Date().getFullYear();
  });

  // reveal-on-scroll (lightweight, respects reduced motion)
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('[data-reveal]');
  function revealAll(){
    revealEls.forEach(function(el){ el.style.opacity = 1; el.style.transform = 'none'; });
  }
  if(!prefersReduced && 'IntersectionObserver' in window && revealEls.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.style.opacity = 1; e.target.style.transform = 'none'; io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function(el){
      el.style.opacity = 0;
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity .5s ease, transform .5s ease';
      io.observe(el);
    });
    // Safety net: never let content stay invisible (covers viewport-resize
    // screenshot tools, slow observer setup, or edge-case browser quirks).
    window.addEventListener('load', function(){ setTimeout(revealAll, 1800); });
  }
})();

// Simple toast helper used across pages
function asikoToast(message){
  var existing = document.querySelector('.toast');
  if(existing) existing.remove();
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = message;
  document.body.appendChild(t);
  requestAnimationFrame(function(){ t.classList.add('show'); });
  setTimeout(function(){
    t.classList.remove('show');
    setTimeout(function(){ t.remove(); }, 300);
  }, 4200);
}
