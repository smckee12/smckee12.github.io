(function () {
  const button = document.querySelector('.theme-toggle');
  if (!button) return;

  function currentTheme() {
    return document.documentElement.dataset.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function updateLabel() {
    button.setAttribute('aria-label', 'Switch to ' + (currentTheme() === 'dark' ? 'light' : 'dark') + ' theme');
  }

  button.addEventListener('click', function () {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    updateLabel();
  });
  updateLabel();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateLabel);
})();
