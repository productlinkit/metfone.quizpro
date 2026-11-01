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
        return '<div class="lb-step ' + x[1] + (p && p.me ? ' is-me' : '') + (p ? '' : ' is-open') + '">' +
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
        return '<li class="lb-row' + (p.me ? ' is-me' : '') + '"><span class="lb-rank">' + (i + 4) + '</span><span class="lb-ava">' + ava(p) + '</span>' +
            '<span class="lb-name">' + esc(p.name) + '</span><span class="lb-score">' + crown + fmt(p.score) + '</span></li>';
    }).join('');

    // What the player stands to win, or has won
    function nextGoal() {
        if (myRank === 1) return t("You're in first place!");
        var goalRank = myRank > 3 ? 3 : myRank - 1, target = players[goalRank - 1];
        return f('{n} more points to reach Rank {r} and win {prize}', { n: fmt(target.score - me.score + 1), r: goalRank, prize: '<b>' + esc(t(prizeFor(goalRank).name)) + '</b>' });
    }
    var status = '';
    if (state === 'empty') {
        status = '<div class="lb-note"><span class="lb-note-ico fa fa-trophy"></span><div><b>' + t('No champion yet') + '</b><p>' + t('Be the first to score and take the top spot.') + '</p></div></div>' +
            '<a href="#" class="btn btn-lg button-primary w-100" id="lbPlay"><span class="fa fa-play"></span> ' + t('Play Now') + '</a>';
    } else if (state === 'ended') {
        var mine = prizeFor(myRank);
        status = '<div class="lb-note"><span class="lb-note-ico fa ' + (mine ? 'fa-gift' : 'fa-flag-checkered') + '"></span><div><b>' + f('You finished #{r}', { r: myRank }) + '</b><p>' +
            (mine ? f('You won {prize}! Our team will contact you.', { prize: '<b>' + esc(t(mine.name)) + '</b>' }) : t('Play again next season to win a prize.')) + '</p></div></div>';
    } else {
        status = '<div class="lb-me-top"><span class="lb-ava">' + ava(me) + '</span>' +
            '<span class="lb-me-score"><small>' + t('Your score') + '</small><b>' + fmt(me.score) + '</b></span>' +
            '<span class="lb-me-rank"><small>' + t('Rank') + '</small><b>#' + myRank + '</b></span></div>' +
            '<p class="lb-me-next">' + nextGoal() + '</p>';
    }
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
