/*
 * Quiz game demo (static site, no server).
 * Categories, levels and the Play button -> level -> play -> result flow.
 * Load after jQuery, session.js and questions.js, before i18n.js / custom.js.
 */
(function () {
    var ROOT = window.QP_SESSION ? QP_SESSION.root : location.origin + '/';
    var user = window.QP_SESSION ? QP_SESSION.user : null;
    function get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
    function set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
    function t(s) { return window.QP_I18N ? QP_I18N.t(s) : s; }

    // ---------- Category data (from the copied pages) ----------
    var CATEGORIES = {
        1:  ['Sports', 'Common sports terms, famous players, rules of games, and memorable moments at sports events.'],
        21: ['Movies & Music', 'Title of popular movies, cast, and memorable scene. Song title, singer, and composer.'],
        22: ['Social Media', 'Social media terms, social media history, founder history, and their achievement.'],
        25: ['Science', 'General knowledge of science, programming, physics, and chemical terms'],
        26: ['Books', 'Title of popular books, novels, popular writers,'],
        28: ['Vehicles', 'Vehicle name, engine, technology.'],
        29: ['Maths', 'Basic Calculation, Number line, Integers and Variables, Algebraic.'],
        30: ['General Knowledge', 'World History, popular news, a world phenomenon, general terms.'],
        31: ['World Map & Flags', 'Name of the country, the capital city, president/leader, geography, demography'],
        32: ['Animal', 'Name of animal, type of animal, animal ability'],
        33: ['Food', 'Name of food, taste, ingredients, food country origin']
    };
    // One opponent per round, kept for the play and result screens
    var OPPONENTS = [
        { name: 'Eissa', img: ROOT + 'uploads/user/1/ava-eissa.png' },
        { name: 'Hella', color: '#B83A5E' },
        { name: 'Dara', color: '#C4161C' },
        { name: 'Sokha', color: '#8A1015' },
        { name: 'Vibol', color: '#5E5E5E' }
    ];
    var OPP_KEY = 'qp_demo_opponent';
    function opponent() { return get(OPP_KEY) || OPPONENTS[0]; }
    function pickOpponent() { var o = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)]; set(OPP_KEY, o); return o; }
    function avatarHtml(o) {
        return o.img ? '<img src="' + o.img + '" alt="' + o.name + '">'
            : '<span class="opp-initial" style="background-color:' + o.color + '">' + o.name.charAt(0) + '</span>';
    }
    var USER_AVATAR = window.QP_SESSION ? QP_SESSION.avatar() : ROOT + 'theme/images/dp.png';

    var LEVELS = [
        { id: 1, title: 'Beginner', points: 10, icon: 'fa-leaf' },
        { id: 2, title: 'Intermediate', points: 20, icon: 'fa-fire' },
        { id: 3, title: 'Advance', points: 30, icon: 'fa-trophy' }
    ];

    // ---------- Questions ----------
    var BANK = window.QP_QUESTIONS || {};
    var PLAYABLE = Object.keys(BANK).map(Number);
    function hasQuizzes(id) { return PLAYABLE.indexOf(+id) !== -1; }

    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

    function buildQuestions(cat, count) {
        var lang = window.QP_I18N ? QP_I18N.LANGS.indexOf(QP_I18N.current()) : 0;
        return shuffle((BANK[cat] || []).slice()).slice(0, count).map(function (q) {
            return { text: typeof q.s === 'string' ? q.s : q.s[lang], answer: q.a };
        });
    }

    // Round over: log Lucky Draw activity, then show the result
    function finishRound(r) {
        // Lucky Draw activity: store answered + correct so either ticket basis works
        var log = get('qp_ld_activity') || [];
        var now = new Date();
        log.unshift({
            date: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') +
                  ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
            quiz: CATEGORIES[r.game] ? CATEGORIES[r.game][0] : 'Quiz', icon: r.game, answered: r.answered, correct: r.correct
        });
        set('qp_ld_activity', log.slice(0, 50));
        set('qp_last_round', r.review); // shown on the result page
        var real = r.correct * r.level.points;
        var q = { res: r.answered && real >= r.opp ? 'win' : 'lose', game: r.game, level: r.level.id,
            real: real, fake: r.opp, correct: r.correct, answered: r.answered, total: r.total };
        if (r.quick) q.quick = 1;
        location.href = ROOT + 'game/result/index.html?' + new URLSearchParams(q);
    }

    // ---------- Short message at the top of the screen ----------
    var toastTimer;
    function toast(msg) {
        var el = document.getElementById('qpToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'qpToast';
            el.className = 'saved-toast qp-toast hide';
            el.setAttribute('role', 'status');
            document.body.appendChild(el);
        }
        el.textContent = t(msg);
        void el.offsetWidth;
        el.classList.remove('hide');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.add('hide'); }, 2200);
    }

    // ---------- Page wiring ----------
    document.addEventListener('DOMContentLoaded', function () {
        // Categories with no quizzes: greyed out, "Coming soon" badge, listed last
        document.querySelectorAll('a.quiz-box[href*="game/detail/"], .quiz-list a[href*="game/detail/"]').forEach(function (a) {
            var id = a.getAttribute('href').match(/game\/detail\/(\d+)\//)[1];
            if (hasQuizzes(id)) return;
            a.classList.add('is-soon');
            var badge = document.createElement('span');
            badge.className = 'soon-badge';
            badge.textContent = t('Coming soon');
            a.appendChild(badge);
            a.addEventListener('click', function (e) { e.preventDefault(); toast('Quizzes coming soon'); });
            var item = a.closest('.quiz-list') || a.parentNode;
            item.parentNode.appendChild(item);
        });

        // Quiz detail (game/detail/{id}/): Play opens the level picker
        var detail = location.pathname.match(/game\/detail\/(\d+)\//);
        var playBtn = document.querySelector('[data-bs-target="#modalplay"]');
        if (detail && playBtn && !hasQuizzes(detail[1])) {
            playBtn.removeAttribute('data-bs-toggle');
            playBtn.removeAttribute('data-bs-target');
            playBtn.addEventListener('click', function (e) { e.preventDefault(); toast('Quizzes coming soon'); });
        } else if (detail && playBtn) {
            var id = detail[1];
            playBtn.removeAttribute('data-bs-toggle');
            playBtn.removeAttribute('data-bs-target');
            playBtn.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('search-result').innerHTML = LEVELS.map(function (l) {
                    return '<a href="' + ROOT + 'game/play/index.html?game=' + id + '&level=' + l.id + '" class="level-card level-' + l.id + '">' +
                        '<span class="level-card-ico"><span class="fa ' + l.icon + '"></span></span>' +
                        '<span class="level-card-name">' + l.title + '</span>' +
                        '<span class="add-point">+' + l.points + ' Point</span></a>';
                }).join('');
                bootstrap.Modal.getOrCreateInstance(document.getElementById('level')).show();
            });
        }
    });

    function loginUrl(next) { return ROOT + 'login/index.html?next=' + encodeURIComponent(next || ''); }

    window.QP_DEMO = { CATEGORIES: CATEGORIES, LEVELS: LEVELS, PLAYABLE: PLAYABLE, user: user, loginUrl: loginUrl, buildQuestions: buildQuestions,
        finishRound: finishRound, toast: toast, opponent: opponent, pickOpponent: pickOpponent, avatarHtml: avatarHtml, USER_AVATAR: USER_AVATAR, ROOT: ROOT };
})();
