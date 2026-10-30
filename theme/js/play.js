/*
 * Quiz round against a demo opponent: True / False answers, instant feedback, one countdown for the whole round.
 * Load after session.js, questions.js, game-demo.js and i18n.js.
 */
(function () {
    var ROUND_SECONDS = 30;    // length of one round
    var ROUND_QUESTIONS = 5;   // questions per round
    var FEEDBACK_MS = 1000;    // how long the answer stays on screen before the next question
    var RING = 113;            // circumference of the countdown circle
    var OPP_HIT_RATE = 0.6;    // how often the demo opponent scores on a question

    var D = window.QP_DEMO, params = new URLSearchParams(location.search);
    var t = window.QP_I18N ? QP_I18N.t : function (s) { return s; };
    var game = parseInt(params.get('game'), 10) || 31;
    var level = D.LEVELS.filter(function (l) { return l.id === parseInt(params.get('level'), 10); })[0] || D.LEVELS[0];
    var questions = D.buildQuestions(game, ROUND_QUESTIONS);
    if (!questions.length) { location.replace(D.ROOT + 'index.html'); return; }

    var el = {};
    ['current', 'maxQuestion', 'playQuestion', 'playScore', 'playGain', 'countdown', 'countdown-number', 'answerToast', 'playAnswers', 'playProgress', 'oppName', 'oppScore', 'oppAva', 'oppAnswer'].forEach(function (id) { el[id] = document.getElementById(id); });
    var ring = el.countdown.querySelector('.game-timer-ring');
    var btnTrue = el.playAnswers.querySelector('[data-answer="true"]'), btnFalse = el.playAnswers.querySelector('[data-answer="false"]');

    var picks = [], oppPicks = [], oppPoints = 0, opp = D.pickOpponent();
    var index = 0, correct = 0, answered = 0, streak = 0, locked = false, finished = false, nextTimer = null, lastTick = null;
    var deadline = Date.now() + ROUND_SECONDS * 1000;

    function replay(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }

    function showQuestion() {
        var q = questions[index];
        el.current.textContent = index + 1;
        el.maxQuestion.textContent = questions.length;
        el.playQuestion.textContent = q.text;
        el.oppAnswer.className = 'play-opp-answer';
        el.oppAnswer.innerHTML = '';
        el.playProgress.innerHTML = questions.map(function (x, i) { return '<i' + (i <= index ? ' class="on"' : '') + '></i>'; }).join('');
        [btnTrue, btnFalse].forEach(function (b) {
            b.className = 'play-btn ' + (b === btnTrue ? 'is-true' : 'is-false');
            b.querySelector('.play-btn-ico').className = 'play-btn-ico fa ' + (b === btnTrue ? 'fa-check' : 'fa-times');
            b.disabled = false;
        });
        locked = false;
    }

    function mark(btn, state) {
        btn.classList.add(state);
        btn.querySelector('.play-btn-ico').className = 'play-btn-ico fa ' + (state === 'right' ? 'fa-check' : 'fa-times');
    }

    function toast(ok) {
        var points = level.points;
        var sub = !ok ? t('Keep going!') : streak >= 2 ? QP_I18N.f('🔥 {n} in a row · +{p}', { n: streak, p: points }) : QP_I18N.f('+{p} points', { p: points });
        el.answerToast.className = 'answer-toast ' + (ok ? 'ok' : 'bad');
        el.answerToast.innerHTML = '<span class="toast-ico"><span class="fa ' + (ok ? 'fa-check' : 'fa-times') + '"></span></span>' +
            '<span class="toast-text"><b>' + t(ok ? 'Correct!' : 'Wrong') + '</b><small>' + sub + '</small></span>';
        replay(el.answerToast, 'show');
    }

    function answer(btn) {
        if (locked || finished) return;
        locked = true;
        btnTrue.disabled = btnFalse.disabled = true;
        var q = questions[index], picked = btn === btnTrue, ok = picked === q.answer;
        answered++;
        picks[index] = picked;
        QP_SOUND.play('tap');
        QP_SOUND.play(ok ? 'correct' : 'wrong');
        if (ok) {
            correct++; streak++;
            mark(btn, 'right');
            el.playScore.textContent = correct * level.points;
            replay(el.playScore, 'pop');
            el.playGain.textContent = '+' + level.points;
            replay(el.playGain, 'show');
        } else {
            streak = 0;
            mark(btn, 'wrong');
            mark(q.answer ? btnTrue : btnFalse, 'right');
        }
        toast(ok);
        // The opponent answers the same question, and the player sees that answer
        var oppOk = Math.random() < OPP_HIT_RATE;
        oppPicks[index] = oppOk ? q.answer : !q.answer;
        if (oppOk) {
            oppPoints += level.points;
            el.oppScore.textContent = oppPoints;
            replay(el.oppScore, 'pop');
        }
        el.oppAnswer.className = 'play-opp-answer show ' + (oppOk ? 'right' : 'wrong');
        el.oppAnswer.innerHTML = '<span class="play-opp-ava">' + D.avatarHtml(opp) + '</span>' +
            '<span>' + $('<div>').text(opp.name).html() + ': <b>' + t(oppPicks[index] ? 'True' : 'False') + '</b></span>' +
            '<span class="fa ' + (oppOk ? 'fa-check' : 'fa-times') + '"></span>';
        nextTimer = setTimeout(function () {
            index++;
            if (index >= questions.length) finish(); else showQuestion();
        }, FEEDBACK_MS);
    }

    function finish() {
        if (finished) return;
        finished = true;
        clearInterval(clock);
        clearTimeout(nextTimer);
        D.finishRound({ game: game, level: level, answered: answered, correct: correct, opp: oppPoints, total: questions.length, quick: params.get('quick') === '1',
            review: questions.map(function (q, i) { return { text: q.text, answer: q.answer, picked: picks[i] === undefined ? null : picks[i], opp: oppPicks[i] === undefined ? null : oppPicks[i] }; }) });
    }

    function tick() {
        var left = Math.max(0, deadline - Date.now());
        var secs = Math.ceil(left / 1000);
        el['countdown-number'].textContent = secs;
        ring.style.strokeDashoffset = RING * (1 - left / (ROUND_SECONDS * 1000));
        el.countdown.classList.toggle('is-low', secs <= 5);
        if (secs !== lastTick) { if (lastTick !== null && secs > 0) QP_SOUND.play('tick'); lastTick = secs; }
        if (left === 0) finish();
    }

    el.playAnswers.addEventListener('click', function (e) {
        var b = e.target.closest('.play-btn');
        if (b) answer(b);
    });

    el.oppName.textContent = opp.name;
    el.oppAva.innerHTML = D.avatarHtml(opp);

    showQuestion();
    var clock = setInterval(tick, 100);
    tick();
})();
