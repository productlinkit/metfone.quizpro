/*
 * Leaderboard screen with three states, previewed through the URL (?state=):
 *   empty = no champion yet, live = season running, ended = champions announced
 * Load after session.js, game-demo.js, i18n.js, bootstrap and leaderboard-config.js.
 */
(function () {
    var S = window.QP_SESSION, C = window.QP_LEADERBOARD, D = window.QP_DEMO, t = QP_I18N.t, f = QP_I18N.f;
    var state = new URLSearchParams(location.search).get('state');
    if (state !== 'empty' && state !== 'ended') state = 'live';

    function $id(id) { return document.getElementById(id); }
    function esc(x) { return $('<div>').text(x).html(); }
    function fmt(n) { return n.toLocaleString('en-US'); }
    var crown = '<span class="lb-crown-ico qf-icon-crown"></span>';
    function ava(p) {
        if (p.me) return '<img src="' + S.avatar() + '" data-user-avatar alt="">';
        if (p.avatar) return '<img src="' + S.root + p.avatar + '" alt="">';
        return '<span class="opp-initial" style="background-color:' + p.color + '">' + esc(p.name.charAt(0)) + '</span>';
    }

    var u = S.user || {};
    var players = state === 'empty' ? [] : C.players.map(function (p) {
        return p.me ? Object.assign({}, p, { name: u.name || u.msisdn || t('You') }) : p;
    }).sort(function (a, b) { return b.score - a.score; });
    var me = players.filter(function (p) { return p.me; })[0];
    var myRank = me ? players.indexOf(me) + 1 : 0;
    function prizeFor(rank) { return C.prizes.filter(function (x) { return x.rank === rank; })[0]; }
    function prizePic(x) { return x.image ? '<img src="' + S.root + x.image + '" alt="">' : '<span class="fa ' + x.icon + '"></span>'; }

    // Banner
    $id('lbBannerTitle').textContent = t(state === 'ended' ? 'Champions Announced!' : 'Win Amazing Prizes!');
    $id('lbBannerSub').textContent = t(state === 'ended' ? "See who won this season's prizes." : 'Earn higher scores or more entries for a chance to win.');
    $id('btnPrizes').firstChild.nodeValue = t(state === 'ended' ? 'View Winners' : 'View Prizes') + ' ';

    // Podium: 2nd, 1st, 3rd; an open spot while nobody holds it
    $id('lbPodium').innerHTML = [[1, 'silver'], [0, 'gold'], [2, 'bronze']].map(function (x) {
        var p = players[x[0]], rank = x[0] + 1;
        return '<div class="lb-step ' + x[1] + (p && p.me ? ' is-me' : '') + (p ? '' : ' is-open') + '" data-rank="' + rank + '">' +
            (rank === 1 ? '<span class="lb-step-crown qf-icon-crown"></span>' : '') +
            '<span class="lb-step-ava">' + (p ? ava(p) : '<span class="lb-open">?</span>') + '</span>' +
            '<div class="lb-pillar"><b class="lb-medal">' + rank + '</b>' +
                '<span class="lb-step-name">' + (p ? esc(p.name) : t('Open spot')) + '</span>' +
                '<span class="lb-step-score">' + crown + (p ? fmt(p.score) : '0') + '</span>' +
                (state === 'ended' ? '<span class="lb-step-prize">' + esc(t(prizeFor(rank).name)) + '</span>' : '') +
            '</div></div>';
    }).join('');

    // Ranked table below the podium
    var rest = players.slice(3);
    $id('lbTable').hidden = !rest.length;
    $id('lbList').innerHTML = rest.map(function (p, i) {
        return '<li class="lb-row' + (p.me ? ' is-me' : '') + '" data-rank="' + (i + 4) + '"><span class="lb-rank">' + (i + 4) + '</span><span class="lb-ava">' + ava(p) + '</span>' +
            '<span class="lb-name">' + esc(p.name) + '</span><span class="lb-score">' + crown + fmt(p.score) + '</span></li>';
    }).join('');

    // Before and after the season: what the player should do next, or what they won
    var status = '';
    if (state === 'empty') {
        status = '<div class="lb-note"><span class="lb-note-ico fa fa-trophy"></span><div><b>' + t('No champion yet') + '</b><p>' + t('Be the first to score and take the top spot.') + '</p></div></div>' +
            '<a href="#" class="btn btn-lg button-primary w-100" id="lbPlay"><span class="fa fa-play"></span> ' + t('Play Now') + '</a>';
    } else if (state === 'ended') {
        var mine = prizeFor(myRank);
        status = '<div class="lb-note"><span class="lb-note-ico fa ' + (mine ? 'fa-gift' : 'fa-flag-checkered') + '"></span><div><b>' + f('You finished #{r}', { r: myRank }) + '</b><p>' +
            (mine ? f('You won {prize}! Our team will contact you.', { prize: '<b>' + esc(t(mine.name)) + '</b>' }) : t('Play again next season to win a prize.')) + '</p></div></div>';
    }
    $id('lbMe').hidden = !status;
    $id('lbMe').innerHTML = status;
    var play = $id('lbPlay');
    if (play) play.addEventListener('click', function (e) {
        e.preventDefault();
        location.href = D.ROOT + 'game/play/index.html?game=' + D.PLAYABLE[Math.floor(Math.random() * D.PLAYABLE.length)] + '&level=1&quick=1';
    });

    // Prizes sheet: opens from the banner
    $id('lbPrizes').innerHTML = C.prizes.map(function (x) {
        var winner = state === 'ended' ? players[x.rank - 1] : null, line;
        if (winner) line = '<span class="lb-prize-state is-won">' + (winner.me ? t('You won') : esc(winner.name)) + '</span>';
        else if (state === 'live' && myRank === x.rank) line = '<span class="lb-prize-state is-won"><span class="fa fa-star"></span>' + t('Your spot') + '</span>';
        else line = '<span class="lb-prize-state"><span class="fa fa-lock"></span>' + t('Locked') + '</span>';
        return '<div class="lb-prize r' + x.rank + '"><span class="lb-prize-ico">' + prizePic(x) + '<b>' + x.rank + '</b></span>' +
            '<span class="lb-prize-info"><b>' + esc(t(x.name)) + '</b><small>' + t('Rank') + ' ' + x.rank + '</small></span>' + line + '</div>';
    }).join('');
    var sheet = bootstrap.Offcanvas.getOrCreateInstance($id('lbSheet'));
    $id('btnPrizes').addEventListener('click', function () { sheet.show(); });

    // Search players on this page: results replace the content below as you type
    var bar = $id('lbSearch'), box = $id('lbSearchBox'), card = $id('lbSearchCard'), results = $id('lbSearchResults'), main = $id('lbMain');
    function preview() {
        var q = box.value.trim().toLowerCase();
        card.hidden = !q;
        main.hidden = !!q;
        if (!q) { results.innerHTML = ''; return; }
        var hits = players.map(function (p, i) { return { p: p, rank: i + 1 }; }).filter(function (h) { return h.p.name.toLowerCase().indexOf(q) !== -1; });
        results.innerHTML = hits.length ? hits.map(function (h) {
            return '<li><button type="button" class="lb-row' + (h.p.me ? ' is-me' : '') + '" data-rank="' + h.rank + '"><span class="lb-rank">' + h.rank + '</span><span class="lb-ava">' + ava(h.p) + '</span>' +
                '<span class="lb-name">' + esc(h.p.name) + '</span><span class="lb-score">' + crown + fmt(h.p.score) + '</span></button></li>';
        }).join('') : '<li class="lb-search-empty">' + t('No player found') + '</li>';
    }
    function closeSearch() { box.value = ''; preview(); bar.hidden = true; }
    function showPlayer(rank) {
        closeSearch();
        var row = document.querySelector('#lbPodium [data-rank="' + rank + '"], #lbList [data-rank="' + rank + '"]');
        if (!row) return;
        row.scrollIntoView({ block: 'center' });
        row.classList.remove('lb-flash');
        void row.offsetWidth;
        row.classList.add('lb-flash');
    }
    $id('btnSearch').addEventListener('click', function (e) {
        e.preventDefault();
        if (bar.hidden) { bar.hidden = false; box.focus(); } else { closeSearch(); }
    });
    $id('lbSearchClose').addEventListener('click', closeSearch);
    box.addEventListener('input', preview);
    box.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSearch();
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var first = results.querySelector('[data-rank]');
        if (first) showPlayer(first.getAttribute('data-rank'));
    });
    results.addEventListener('click', function (e) {
        var b = e.target.closest('[data-rank]');
        if (b) showPlayer(b.getAttribute('data-rank'));
    });

    // Champions announced: confetti and a pop-up with the winner and the prize
    if (state === 'ended') {
        document.body.classList.add('is-win', 'lb-ended');
        var w = players[0], grand = prizeFor(1);
        $id('lbChampAva').innerHTML = ava(w);
        $id('lbChampName').textContent = w.name;
        $id('lbChampScore').innerHTML = crown + fmt(w.score);
        $id('lbChampPrize').innerHTML = '<span class="lb-prize-ico">' + prizePic(grand) + '</span><span><small>' + t('Wins') + '</small><b>' + esc(t(grand.name)) + '</b></span>';
        bootstrap.Modal.getOrCreateInstance($id('lbChamp')).show();
    }
})();
