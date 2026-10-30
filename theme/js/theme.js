/* Saved theme (Profile > Theme). Loaded in <head> so the page never flashes the wrong colors. */
(function () {
    var theme = null;
    try { theme = localStorage.getItem('qp_theme'); } catch (e) {}
    if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
})();
