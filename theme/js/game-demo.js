/*
 * Quiz game demo (static site, no server).
 * Answers the AJAX calls made by quiz.js with dummy data and wires the
 * Play button -> level -> match -> play -> result flow.
 * Load after jQuery and session.js, before quiz.js / custom.js.
 * Game data and fake endpoints come from quizpro-app's demo-backend.js.
 */
(function () {
    var ROOT = window.QP_SESSION ? QP_SESSION.root : location.origin + '/';
    var user = window.QP_SESSION ? QP_SESSION.user : null;
    function store(kind) { try { return window[kind]; } catch (e) { return null; } }
    function get(key) { try { return JSON.parse(store('localStorage').getItem(key)); } catch (e) { return null; } }
    function set(key, val) { try { store('localStorage').setItem(key, JSON.stringify(val)); } catch (e) {} }
    function param(name) { return new URLSearchParams(location.search).get(name); }

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
    // Opponents for the VS screen; one is picked per match and kept for play + result
    var OPPONENTS = [
        { name: 'Eissa', img: ROOT + 'uploads/user/1/ava-eissa.png' },
        { name: 'Hella', color: '#F18D91' },
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
        { id: 1, title: 'Beginner', points: 10 },
        { id: 2, title: 'Intermediate', points: 20 },
        { id: 3, title: 'Advance', points: 30 }
    ];

    // ---------- Dummy questions ----------
    // True/false statements only, so quiz.js always renders the swipe card (game_type = null).
    var BANK = [
        { cat: 31, q: 'Canberra is the capital city of Australia.', answer: true },
        { cat: 31, q: 'The Nile flows through Brazil.', answer: false },
        { cat: 31, q: 'Tokyo is the capital city of Japan.', answer: true },
        { cat: 31, q: 'The flag of Canada has a red maple leaf.', answer: true },
        { cat: 31, q: 'The Atlantic is the largest ocean in the world.', answer: false },
        { cat: 25, q: 'Water boils at 100°C at sea level.', answer: true },
        { cat: 25, q: 'Sound travels faster than light.', answer: false },
        { cat: 25, q: 'Plants absorb carbon dioxide from the air.', answer: true },
        { cat: 29, q: '7 × 8 = 56', answer: true },
        { cat: 29, q: 'A triangle has four sides.', answer: false },
        { cat: 29, q: '15 is an even number.', answer: false },
        { cat: 1,  q: 'A football team has 11 players on the field.', answer: true },
        { cat: 1,  q: 'A marathon is longer than 40 km.', answer: true },
        { cat: 1,  q: 'In tennis, a score of zero is called "love".', answer: true },
        { cat: 32, q: 'A whale is a mammal.', answer: true },
        { cat: 32, q: 'Spiders have six legs.', answer: false },
        { cat: 32, q: 'Penguins can fly.', answer: false },
        { cat: 33, q: 'Honey is made by bees.', answer: true },
        { cat: 33, q: 'Sushi originally comes from Japan.', answer: true },
        { cat: 33, q: 'A tomato grows underground.', answer: false },
        { cat: 30, q: 'There are seven continents.', answer: true },
        { cat: 30, q: 'A leap year has 365 days.', answer: false },
        { cat: 30, q: 'The sun rises in the east.', answer: true },
        { cat: 28, q: 'An electric car needs petrol to run.', answer: false },
        { cat: 28, q: 'A bicycle has an engine.', answer: false },
        { cat: 26, q: 'A person who writes books is called an author.', answer: true },
        { cat: 26, q: 'A dictionary lists words in alphabetical order.', answer: true },
        { cat: 21, q: 'A guitar usually has six strings.', answer: true },
        { cat: 21, q: 'A movie director acts in every scene of the film.', answer: false },
        { cat: 22, q: 'A hashtag starts with the # symbol.', answer: true },
        { cat: 22, q: 'You need a stamp to send an email.', answer: false }
    ];

    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

    function buildQuestions(cat) {
        var own = shuffle(BANK.filter(function (q) { return q.cat === cat; }));
        var rest = shuffle(BANK.filter(function (q) { return q.cat !== cat; }));
        return own.concat(rest).slice(0, 10).map(function (q, i) {
            var qid = 100 + i;
            // quiz.js maps questionChoice[0] to the left button (swipe left) and [1] to the right (swipe right)
            var choices = [{ id: 'q' + qid + 'false', choice: 'False' }, { id: 'q' + qid + 'true', choice: 'True' }];
            return {
                question_id: qid,
                question: q.q,
                quiz_image: 0,
                quiz_video: null,
                game_type: null,
                questionChoice: choices,
                _correct: choices[q.answer ? 1 : 0].id
            };
        });
    }

    // ---------- Fake AJAX endpoints ----------
    var GAME_KEY = 'qp_demo_game';
    function game() { return get(GAME_KEY) || {}; }

    function isCorrect(g, qid, answer) {
        var q = (g.questions || []).filter(function (x) { return String(x.question_id) === String(qid); })[0];
        return q ? { ok: q._correct === String(answer), correct: q._correct } : { ok: false, correct: null };
    }

    // Let the page react to answers (header feedback) without touching quiz.js
    function emit(name, detail) { setTimeout(function () { document.dispatchEvent(new CustomEvent(name, { detail: detail })); }, 0); }

    var ROUTES = {
        '/game_category': function () {
            return { success: 1, result: LEVELS };
        },
        '/quiz/question': function () {
            var cat = parseInt(param('game'), 10) || 31;
            var level = LEVELS.filter(function (l) { return l.id === (parseInt(param('level'), 10) || 1); })[0];
            var qs = buildQuestions(cat);
            set(GAME_KEY, { cat: cat, level: level, questions: qs, real: 0, fake: 0, correct: 0 });
            return { success: 1, data: qs, length: qs.length };
        },
        '/changlang': function () {
            return { success: 1 };
        },
        '/quiz_timer': function () {
            return { success: 1, pair_id: 1, time: 60 };
        },
        '/quiz/play/answer_check': function (d) {
            var g = game(), r = isCorrect(g, d.question_id, d.answer);
            emit('qp:answer', { ok: r.ok, points: g.level ? g.level.points : 10 });
            return { success: 1, answer: r.ok ? 'right' : 'wrong', correct_answer_id: r.correct };
        },
        '/quiz/play/score_calculation': function (d) {
            var g = game(), r = isCorrect(g, d.question_id, d.answer);
            if (r.ok) { g.real += g.level.points; g.correct++; }
            if (Math.random() < 0.6) g.fake += g.level.points; // demo opponent
            set(GAME_KEY, g);
            emit('qp:score', { real: g.real, fake: g.fake });
            return { success: 1, real_user: g.real, fake_user: g.fake };
        }
    };

    function parseData(d) {
        if (!d) return {};
        if (typeof d === 'object') return d;
        var o = {}; new URLSearchParams(d).forEach(function (v, k) { o[k] = v; }); return o;
    }

    if (window.jQuery) {
        jQuery.ajaxTransport('+*', function (opts) {
            var path = Object.keys(ROUTES).filter(function (r) { return (opts.url || '').slice(-r.length) === r; })[0];
            if (!path) return;
            return {
                send: function (headers, complete) {
                    var body = ROUTES[path](parseData(opts.data));
                    complete(200, 'OK', { text: JSON.stringify(body) });
                },
                abort: function () {}
            };
        });
    }

    // quiz.js redirects to /game/result/... on the server; send it to the local result page instead.
    // (DOMContentLoaded, not load: the game page's server-hosted audio can hold up the load event)
    document.addEventListener('DOMContentLoaded', function () {
        if (typeof window.resultGenarate !== 'function') return;
        window.resultGenarate = function (qna) {
            if (window.timer) clearInterval(window.timer);
            try { localStorage.removeItem('setTimer'); } catch (e) {}
            var g = game(), real = 0, correct = 0, answered = 0;
            (g.questions || []).forEach(function (q) {
                if (qna[q.question_id] === undefined) return;
                answered++;
                if (q._correct === String(qna[q.question_id])) { correct++; real += g.level.points; }
            });
            var fake = Math.max(g.fake || 0, 0);
            var win = real >= fake;
            // Lucky Draw activity: store answered + correct so either ticket basis works
            var log = get('qp_ld_activity') || [];
            var now = new Date();
            log.unshift({
                date: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') +
                      ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
                quiz: CATEGORIES[g.cat] ? CATEGORIES[g.cat][0] : 'Quiz', icon: g.cat, answered: answered, correct: correct
            });
            set('qp_ld_activity', log.slice(0, 50));
            location.href = ROOT + 'game/result/index.html?' + new URLSearchParams({
                res: win ? 'win' : 'lose', game: g.cat, level: g.level ? g.level.id : 1,
                real: real, fake: fake, correct: correct, answered: answered, total: (g.questions || []).length
            });
        };
    });


    // ---------- Page wiring ----------
    document.addEventListener('DOMContentLoaded', function () {
        // quiz.js labels the swipe buttons No / Yes; this demo uses True / False statements
        var answerBox = document.getElementById('answerOption');
        if (answerBox) {
            var t = function (s) { return window.QP_I18N ? QP_I18N.t(s) : s; };
            var relabel = function () {
                var no = answerBox.querySelector('#nope'), yes = answerBox.querySelector('#love');
                if (no && no.textContent !== t('False')) no.textContent = t('False');
                if (yes && yes.textContent !== t('True')) yes.textContent = t('True');
            };
            new MutationObserver(relabel).observe(answerBox, { childList: true, subtree: true });
            relabel();
        }

        // Quiz detail (game/detail/{id}/): logged-in users pick a level instead of seeing "Please login first"
        var detail = location.pathname.match(/game\/detail\/(\d+)\//);
        var playBtn = document.querySelector('[data-bs-target="#modalplay"]');
        if (detail && playBtn && user) {
            var id = detail[1];
            // Not the "Please login first" modal any more
            playBtn.removeAttribute('data-bs-toggle');
            playBtn.removeAttribute('data-bs-target');
            playBtn.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('search-result').innerHTML = LEVELS.map(function (l) {
                    return '<a href="' + ROOT + 'game/match/index.html?game=' + id + '&level=' + l.id + '" class="btn btn-lg text-start w-100 button-primary">' +
                        l.title + '<span class="add-point">+' + l.points + ' Point</span></a>';
                }).join('');
                bootstrap.Modal.getOrCreateInstance(document.getElementById('level')).show();
            });
        }
    });

    function loginUrl(next) { return ROOT + 'login/index.html?next=' + encodeURIComponent(next || ''); }

    window.QP_DEMO = { CATEGORIES: CATEGORIES, LEVELS: LEVELS, user: user, loginUrl: loginUrl, opponent: opponent,
        pickOpponent: pickOpponent, avatarHtml: avatarHtml, USER_AVATAR: USER_AVATAR, ROOT: ROOT };
})();
