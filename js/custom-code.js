(function () {
  function addMacHeaders() {
    document.querySelectorAll('figure > .code-wrapper').forEach(function (wrapper) {
      var fig = wrapper.parentElement;
      if (fig.querySelector('.code-mac-header')) return;

      var header = document.createElement('div');
      header.className = 'code-mac-header';

      // Traffic light dots
      var dots = document.createElement('div');
      dots.className = 'code-mac-dots';
      ['red', 'yellow', 'green'].forEach(function (color) {
        var dot = document.createElement('span');
        dot.className = 'dot ' + color;
        dots.appendChild(dot);
      });
      header.appendChild(dots);

      // Language label (centered)
      var pre = wrapper.querySelector('pre[data-language]');
      var lang = pre && pre.dataset.language;
      if (lang && lang !== 'none' && lang !== 'id' && lang !== 'TEXT') {
        var langEl = document.createElement('span');
        langEl.className = 'code-mac-lang';
        langEl.textContent = lang;
        header.appendChild(langEl);
      }

      // Copy button (right side)
      var copyBtn = document.createElement('button');
      copyBtn.className = 'code-mac-copy';
      copyBtn.textContent = 'copy';
      copyBtn.addEventListener('click', function () {
        var codeEl = wrapper.querySelector('code');
        if (!codeEl) return;
        var text = codeEl.innerText || codeEl.textContent;
        navigator.clipboard.writeText(text).then(function () {
          copyBtn.textContent = 'copied!';
          setTimeout(function () { copyBtn.textContent = 'copy'; }, 2000);
        }).catch(function () {
          var ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copyBtn.textContent = 'copied!';
          setTimeout(function () { copyBtn.textContent = 'copy'; }, 2000);
        });
      });
      header.appendChild(copyBtn);

      fig.insertBefore(header, wrapper);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addMacHeaders);
  } else {
    addMacHeaders();
  }
})();
