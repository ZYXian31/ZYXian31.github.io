// Replace "目录" header text with the actual article title
(function () {
  function setTocTitle() {
    var titleEl = document.getElementById('seo-header');
    var tocSpan = document.querySelector('#toc .toc-header span');
    if (titleEl && tocSpan) {
      tocSpan.textContent = titleEl.textContent.trim();
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setTocTitle);
  } else {
    setTocTitle();
  }
})();
