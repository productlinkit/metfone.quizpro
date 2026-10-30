/*
 * Demo player (static site, no server, no login).
 * Every visitor is a player straight away; the profile is kept in localStorage.
 * Load after jQuery and Bootstrap on every page.
 */
(function () {
    var KEY = 'qp_user';
    var DEFAULT_AVATAR = 'theme/images/dp.png';
    var AVATAR_KEY = 'qp_avatar', SOUND_KEY = 'qp_sound';
    var AVATAR_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return 'theme/images/avatars/' + n + '.svg'; });

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

    var user = load();
    if (user && typeof user !== 'object') user = { msisdn: String(user) };
    if (!user) { user = { name: 'Guest', msisdn: '1234567890' }; save(user); }

    // Avatar: a preset path or an uploaded photo (data URL)
    function avatar() {
        var v = null;
        try { v = localStorage.getItem(AVATAR_KEY); } catch (e) {}
        v = v || user.avatar || DEFAULT_AVATAR;
        return /^data:/.test(v) ? v : ROOT + v;
    }
    function paintAvatars() { document.querySelectorAll('img[data-user-avatar]').forEach(function (img) { img.src = avatar(); }); }
    function setAvatar(v) {
        try { localStorage.setItem(AVATAR_KEY, v); } catch (e) { return false; }
        paintAvatars();
        return true;
    }
    // Crop to a square and shrink the photo so it fits in browser storage
    function shrinkPhoto(file, done, fail) {
        var reader = new FileReader();
        reader.onload = function () {
            var img = new Image();
            img.onload = function () {
                var size = 200, c = document.createElement('canvas'), k = Math.min(img.width, img.height);
                c.width = c.height = size;
                c.getContext('2d').drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, size, size);
                done(c.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = fail;
            img.src = reader.result;
        };
        reader.onerror = fail;
        reader.readAsDataURL(file);
    }

    window.QP_SESSION = { user: user, root: ROOT, avatar: avatar, setAvatar: setAvatar, shrinkPhoto: shrinkPhoto, AVATAR_PRESETS: AVATAR_PRESETS };

    // Sound effects: every sound goes through here, so Off means silent everywhere
    var SOUNDS = { tap: 'pop.mp3', correct: 'answer-correct.wav', wrong: 'answer-wrong.wav', tick: 'Ticking_Clock.wav' }, players = {};
    window.QP_SOUND = {
        on: function () { try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch (e) { return true; } },
        set: function (on) { try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (e) {} },
        play: function (name) {
            if (!this.on() || !SOUNDS[name]) return;
            var a = players[name] || (players[name] = new Audio(ROOT + 'theme/audio/' + SOUNDS[name]));
            a.currentTime = 0;
            var p = a.play();
            if (p && p.catch) p.catch(function () {}); // browsers block sound until the first tap
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        paintAvatars();

        var name = user.name || user.msisdn;
        if (page === 'index.html') document.querySelectorAll('.home-profile-name').forEach(function (el) { el.textContent = name; });
        if (page === 'profile/index.html') {
            document.querySelectorAll('.home-profile-name').forEach(function (el) { el.textContent = user.name || 'Hello'; });
            document.querySelectorAll('.home-profile-status').forEach(function (el) { el.textContent = user.msisdn; });
        }

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
        if (page === 'profile/edit/index.html') {
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

            fileIn.addEventListener('change', function () {
                ferr.textContent = '';
                var file = fileIn.files[0]; if (!file) return;
                if (!/^image\//.test(file.type)) { ferr.textContent = 'Please choose an image file'; fileIn.value = ''; return; }
                shrinkPhoto(file, function (src) {
                    newAvatar = src;
                    preview.src = newAvatar;
                }, function () { ferr.textContent = 'This image could not be read'; });
            });

            pform.addEventListener('submit', function (e) {
                e.preventDefault();
                var v = nameIn.value.trim();
                err.textContent = v ? '' : 'Please enter your name';
                if (!v) return;
                user.name = v;
                if (!save(user) || (newAvatar && !setAvatar(newAvatar))) { ferr.textContent = 'Could not save, the photo may be too large'; return; }
                location.href = ROOT + 'profile/index.html?saved=1';
            });
        }
    });
})();
