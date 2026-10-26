/* Clickjacking guard. GitHub Pages can't send X-Frame-Options / frame-ancestors headers,
   so: if this page is loaded inside another site's frame, hide it and try to break out. */
(function(){
  if (window.top !== window.self) {
    document.documentElement.classList.add('framed');
    try { window.top.location.replace(window.self.location.href); } catch (e) {}
  }
})();
