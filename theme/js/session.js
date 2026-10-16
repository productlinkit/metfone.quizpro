/*
 * Demo login session (static site, no server).
 * Any MSISDN + password logs in; the user is kept in localStorage.
 * Load after jQuery and Bootstrap on every page.
 */
(function () {
    var KEY = 'qp_user';
    var DEFAULT_AVATAR = 'theme/images/dp.png';
    var MEMBER_PAGES = ['profile/index.html', 'profile/edit/index.html', 'game/history/index.html',
        'game/match/index.html', 'game/play/index.html', 'game/result/index.html'];

    // Site root, worked out from this script's own URL (…/theme/js/session.js)
    var script = document.currentScript;
    var ROOT = script ? script.src.replace(/theme\/js\/session\.js.*$/, '') : location.origin + '/';
    var page = location.href.split(/[?#]/)[0].replace(ROOT, '');
    if (page === '' || /\/$/.test(page)) page += 'index.html';

    function param(name) { return new URLSearchParams(location.search).get(name); }
    function load() {
        var raw = null;
        try { raw = localStorage.getItem(KEY); } catch (e) {}
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return { msisdn: raw }; } // older demo stored the plain MSISDN
    }
    function save(u) { try { localStorage.setItem(KEY, JSON.stringify(u)); return true; } catch (e) { return false; } }
    function loginUrl(next) { return ROOT + 'login/index.html?next=' + encodeURIComponent(next || page); }
    function safeNext() {
        var n = param('next') || '';
        return /^([a-z0-9-]+\/)*index\.html$/.test(n) && n.indexOf('login/') !== 0 ? n : 'index.html';
    }

    var user = load();
    if (user && typeof user !== 'object') user = { msisdn: String(user) };

    if (!user && MEMBER_PAGES.indexOf(page) !== -1) { location.replace(loginUrl()); return; }
    if (user && page === 'login/index.html') { location.replace(ROOT + safeNext()); return; }

    window.QP_SESSION = { user: user, root: ROOT, avatar: function () { return (user && user.avatar) || ROOT + DEFAULT_AVATAR; } };

    document.addEventListener('DOMContentLoaded', function () {
        // Login: any MSISDN + password works
        if (page === 'login/index.html') {
            var form = document.querySelector('form');
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var m = document.getElementById('msisdn'), p = document.getElementById('password'), ok = true;
                [[m, 'Please enter your MSISDN'], [p, 'Please enter your password']].forEach(function (f) {
                    var err = f[0].closest('.mb-3').querySelector('.text-danger');
                    err.textContent = f[0].value.trim() ? '' : f[1];
                    if (!f[0].value.trim()) ok = false;
                });
                if (!ok) return;
                save({ msisdn: m.value.trim() });
                location.href = ROOT + safeNext();
            });
        }

        if (user) {
            var name = user.name || user.msisdn;
            // Profile tab goes to the profile instead of the login page
            document.querySelectorAll('.bottom-nav a[href$="login/index.html"]').forEach(function (a) { a.href = ROOT + 'profile/index.html'; });
            if (page === 'index.html') document.querySelectorAll('.home-profile-name').forEach(function (el) { el.textContent = name; });
            if (page === 'profile/index.html') {
                document.querySelectorAll('.home-profile-name').forEach(function (el) { el.textContent = user.name || 'Hello'; });
                document.querySelectorAll('.home-profile-status').forEach(function (el) { el.textContent = user.msisdn; });
            }
            document.querySelectorAll('img[data-user-avatar]').forEach(function (img) { img.src = window.QP_SESSION.avatar(); });
        } else {
            // Guests: login links come back to this page afterwards
            document.querySelectorAll('a[href$="login/index.html"]').forEach(function (a) { a.href = loginUrl(); });
        }

        // Logout asks for confirmation first
        document.querySelectorAll('a[data-logout]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                var m = document.getElementById('modalLogout');
                if (!m) {
                    m = document.createElement('div');
                    m.className = 'modal fade modal-standard';
                    m.id = 'modalLogout';
                    m.tabIndex = -1;
                    m.innerHTML =
                        '<div class="modal-dialog modal-dialog-centered"><div class="modal-content confirm-modal">' +
                            '<span class="confirm-ico"><span class="qf-icon-out"></span></span>' +
                            '<h3 class="modal-level-title mb-2">Log out?</h3>' +
                            '<p class="confirm-text">You will need to log in again to play quizzes and collect Lucky Draw tickets.</p>' +
                            '<button type="button" class="btn btn-lg button-primary w-100 mb-2" data-bs-dismiss="modal">Cancel</button>' +
                            '<button type="button" class="btn btn-lg confirm-danger w-100" id="btnLogoutConfirm">Yes, Log out</button>' +
                        '</div></div>';
                    document.body.appendChild(m);
                    m.querySelector('#btnLogoutConfirm').addEventListener('click', function () {
                        try { localStorage.removeItem(KEY); } catch (err) {}
                        location.href = ROOT + 'index.html';
                    });
                }
                bootstrap.Modal.getOrCreateInstance(m).show();
            });
        });

        // Profile saved: short confirmation
        if (page === 'profile/index.html' && param('saved')) {
            var note = document.createElement('div');
            note.className = 'saved-toast';
            note.innerHTML = '<span class="qf-icon-thumbs-up"></span> Profile updated';
            document.body.appendChild(note);
            setTimeout(function () { note.classList.add('hide'); }, 2200);
            history.replaceState(null, '', location.pathname);
        }

        // Edit profile: save in the browser instead of posting to a server
        if (page === 'profile/edit/index.html' && user) {
            var pform = document.querySelector('form'), nameIn = document.getElementById('username'),
                fileIn = document.getElementById('avatar'), preview = document.querySelector('img[data-user-avatar]'), newAvatar = null;
            nameIn.value = user.name || '';
            nameIn.maxLength = 20;
            fileIn.accept = 'image/*';
            var err = document.createElement('small');
            err.className = 'text-danger d-block mt-1';
            nameIn.parentNode.appendChild(err);
            var ferr = document.createElement('small');
            ferr.className = 'text-danger d-block mt-1';
            fileIn.parentNode.appendChild(ferr);

            // Shrink the photo so it fits in browser storage
            fileIn.addEventListener('change', function () {
                ferr.textContent = '';
                var file = fileIn.files[0]; if (!file) return;
                if (!/^image\//.test(file.type)) { ferr.textContent = 'Please choose an image file'; fileIn.value = ''; return; }
                var reader = new FileReader();
                reader.onload = function () {
                    var img = new Image();
                    img.onload = function () {
                        var size = 200, c = document.createElement('canvas'), k = Math.min(img.width, img.height);
                        c.width = c.height = size;
                        c.getContext('2d').drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, size, size);
                        newAvatar = c.toDataURL('image/jpeg', 0.85);
                        preview.src = newAvatar;
                    };
                    img.onerror = function () { ferr.textContent = 'This image could not be read'; };
                    img.src = reader.result;
                };
                reader.readAsDataURL(file);
            });

            pform.addEventListener('submit', function (e) {
                e.preventDefault();
                var v = nameIn.value.trim();
                err.textContent = v ? '' : 'Please enter your name';
                if (!v) return;
                user.name = v;
                if (newAvatar) user.avatar = newAvatar;
                if (!save(user)) { ferr.textContent = 'Could not save, the photo may be too large'; return; }
                location.href = ROOT + 'profile/index.html?saved=1';
            });
        }
    });
})();
