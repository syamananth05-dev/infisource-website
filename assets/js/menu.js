/* InfiSource Global - menu behaviour: close on outside click / Escape */
(function(){
  var d = document;
  function close(){ d.body.classList.remove('menu-open'); }
  d.addEventListener('click', function(e){
    if (!d.body.classList.contains('menu-open')) return;
    if (e.target && e.target.closest && e.target.closest('.drawer, .burger')) return;
    close();
  });
  d.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
})();
