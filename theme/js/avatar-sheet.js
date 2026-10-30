/*
 * Home: tap the avatar to pick a preset or upload a photo (bottom sheet).
 * The choice is saved by session.js and shows everywhere the avatar appears.
 */
(function () {
    var S = window.QP_SESSION, btn = document.getElementById('btnAvatar');
    if (!S || !btn) return;
    var t = window.QP_I18N ? QP_I18N.t : function (s) { return s; };

    var sheet = document.createElement('div');
    sheet.className = 'offcanvas offcanvas-bottom avatar-sheet';
    sheet.tabIndex = -1;
    sheet.setAttribute('aria-labelledby', 'avatarSheetTitle');
    sheet.innerHTML =
        '<div class="avatar-sheet-head">' +
            '<h3 class="avatar-sheet-title" id="avatarSheetTitle">' + t('Choose your avatar') + '</h3>' +
            '<button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>' +
        '</div>' +
        '<div class="avatar-sheet-grid">' + S.AVATAR_PRESETS.map(function (src) {
            return '<button type="button" class="avatar-opt" data-src="' + src + '"><img src="' + S.root + src + '" alt=""></button>';
        }).join('') + '</div>' +
        '<label class="btn btn-lg button-primary w-100 avatar-upload"><span class="fa fa-camera"></span> ' + t('Upload photo') +
            '<input type="file" accept="image/*" id="avatarFile" hidden></label>' +
        '<small class="text-danger d-block mt-2 text-center" id="avatarErr"></small>';
    document.body.appendChild(sheet);

    var drawer = new bootstrap.Offcanvas(sheet), err = sheet.querySelector('#avatarErr'), file = sheet.querySelector('#avatarFile');
    function fail() { err.textContent = t('This image could not be read'); }
    function choose(v) {
        if (!S.setAvatar(v)) { err.textContent = t('Could not save, the photo may be too large'); return; }
        drawer.hide();
    }

    btn.addEventListener('click', function () {
        err.textContent = '';
        var cur = S.avatar();
        sheet.querySelectorAll('.avatar-opt').forEach(function (o) { o.classList.toggle('on', S.root + o.getAttribute('data-src') === cur); });
        drawer.show();
    });
    sheet.querySelector('.avatar-sheet-grid').addEventListener('click', function (e) {
        var o = e.target.closest('.avatar-opt');
        if (!o) return;
        QP_SOUND.play('tap');
        choose(o.getAttribute('data-src'));
    });
    file.addEventListener('change', function () {
        err.textContent = '';
        var f = file.files[0];
        file.value = '';
        if (!f) return;
        if (!/^image\//.test(f.type)) { err.textContent = t('Please choose an image file'); return; }
        S.shrinkPhoto(f, choose, fail);
    });
})();
