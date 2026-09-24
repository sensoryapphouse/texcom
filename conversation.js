// Conversations over the internet: the TexCom user and a partner anywhere.
// The partner joins from a link (any web browser: companion.html) or from their own TexCom ("Join a conversation").
// Transport: PeerJS / WebRTC. The free PeerJS server introduces the two devices; messages then go directly between
// them, or through the TexCom relay (Cloudflare TURN) on networks that block direct connections.
//
// Each conversation has a fresh link; nobody joins without the TexCom user allowing it.
// Messages are small objects: {t:'hello', name, app, token} {t:'accepted', token, name} {t:'declined'} {t:'busy'}
//                             {t:'say', text} {t:'bye'}
(function () {
    const RELAY_URL = 'https://texcom-relay.dave-c09.workers.dev/ice';
    const PUBLIC_BASE = 'https://sensoryapphouse.github.io/texcom/'; // where companion.html is published
    const FALLBACK_ICE = [{ urls: 'stun:stun.cloudflare.com:3478' }, { urls: 'stun:stun.l.google.com:19302' }];
    const ID_PREFIX = 'texcom-';
    const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'; // no 0/o, 1/l/i

    const C = window.Conversation = {
        role: null,          // 'host' (started it) or 'guest' (joined someone's)
        peer: null,
        conn: null,          // the open, allowed connection
        code: '',
        partnerName: '',
        token: '',           // lets an allowed partner reconnect without asking again
        ended: true,
        relay: false,
        get active() { return !this.ended; },
        get connected() { return !!(this.conn && this.conn.open); },
    };

    function myName() { return (typeof params !== 'undefined' && params.UserName && params.UserName.trim()) || 'TexCom user'; }
    function randomCode(n) {
        const a = new Uint32Array(n); crypto.getRandomValues(a);
        return [...a].map(x => CODE_CHARS[x % CODE_CHARS.length]).join('');
    }
    function inviteLink() {
        const base = /^https?:/.test(location.protocol) ? new URL('companion.html', location.href).href : PUBLIC_BASE + 'companion.html';
        return base + '?id=' + C.code;
    }
    // A code ("k7m2qx9p") or any link containing ?id=...
    function parseCode(input) {
        input = (input || '').trim();
        const m = input.match(/[?&]id=([A-Za-z0-9_-]+)/);
        let code = m ? m[1] : input;
        code = code.replace(/^texcom-/i, '').replace(/[\s-]/g, '').toLowerCase();
        return /^[a-z0-9]{6,16}$/.test(code) ? code : '';
    }

    async function iceServers() {
        try {
            const ctl = new AbortController();
            const timer = setTimeout(() => ctl.abort(), 4000);
            const r = await fetch(RELAY_URL, { signal: ctl.signal, cache: 'no-store' });
            clearTimeout(timer);
            const j = await r.json();
            C.relay = !!j.relay;
            if (Array.isArray(j.iceServers) && j.iceServers.length) return j.iceServers;
        } catch (e) { C.relay = false; }
        return FALLBACK_ICE;
    }

    // ---------- UI hooks (see the #convDialog and #convBar markup in index.html) ----------
    function status(text, kind) {
        const el = document.getElementById('convStatus');
        if (el) { el.textContent = text; el.dataset.kind = kind || ''; }
        updateBar();
    }
    function updateBar() {
        const bar = document.getElementById('convBar');
        if (!bar) return;
        bar.hidden = C.ended;
        const label = document.getElementById('convBarLabel');
        if (label) {
            label.textContent = C.connected ? C.partnerName
                : (C.role === 'host' ? 'Waiting for someone to join…' : 'Connecting…');
        }
        bar.dataset.state = C.connected ? 'on' : 'waiting';
        if (typeof toggleChatInterface === 'function') toggleChatInterface(chatShouldShow());
    }
    window.chatShouldShow = function () {
        return !!((typeof params !== 'undefined' && params.chatInterface) || C.active);
    };

    function notify(kind, text) {
        if (typeof Notiflix !== 'undefined' && Notiflix.Notify) Notiflix.Notify[kind](text, { timeout: 5000 });
    }

    // ---------- Host: start a conversation ----------
    C.start = async function () {
        if (C.active && C.role === 'host') { openDialog('invite'); return; }
        if (C.active) C.end();
        C.role = 'host'; C.ended = false; C.code = randomCode(8); C.token = ''; C.partnerName = '';
        openDialog('invite');
        status('Getting a link…');
        const config = { iceServers: await iceServers() };
        if (C.ended) return;
        C.peer = new Peer(ID_PREFIX + C.code, { config, debug: 0 });
        C.peer.on('open', () => { showInvite(); status('Waiting for someone to join…'); });
        C.peer.on('connection', onIncoming);
        C.peer.on('disconnected', () => { if (!C.ended && C.peer && !C.peer.destroyed) C.peer.reconnect(); });
        C.peer.on('error', err => {
            if (err.type === 'unavailable-id') { C.end(); C.start(); return; } // code already taken: new one
            status(err.type === 'network' || err.type === 'server-error' ? 'No internet connection. Trying again…' : 'Connection problem (' + err.type + ')', 'bad');
        });
    };

    function onIncoming(c) {
        c.on('data', msg => {
            if (!msg || typeof msg !== 'object') return;
            if (msg.t === 'hello') {
                const name = String(msg.name || 'Someone').slice(0, 40);
                if (C.connected && c !== C.conn) { c.send({ t: 'busy' }); setTimeout(() => c.close(), 300); return; }
                if (C.token && msg.token === C.token) { accept(c, name); return; } // allowed before: reconnecting
                askToAllow(name, () => accept(c, name), () => { c.send({ t: 'declined' }); setTimeout(() => c.close(), 300); });
            } else if (c === C.conn) {
                onMessage(msg);
            }
        });
        c.on('close', () => {
            if (c !== C.conn || C.ended) return;
            C.conn = null;
            status(C.partnerName + ' disconnected. Waiting for them to come back…', 'bad');
        });
    }

    function askToAllow(name, yes, no) {
        const run = () => {
            if (typeof Notiflix !== 'undefined' && Notiflix.Confirm) {
                Notiflix.Confirm.show('Someone wants to join', name + ' wants to join your conversation.', 'Allow', 'Decline', yes, no, {
                    okButtonBackground: '#16a34a', okButtonColor: '#ffffff', cancelButtonBackground: '#e2e8f0', cancelButtonColor: '#1e293b',
                    titleFontSize: '22px', messageFontSize: '18px', buttonsFontSize: '18px', width: '340px', messageMaxLength: 200, fontFamily: 'inherit'
                });
            } else if (confirm(name + ' wants to join your conversation. Allow?')) yes(); else no();
        };
        if (typeof speak === 'function' && params && params.readPartnerAloud) speak(name + ' wants to join.', true);
        run();
    }

    function accept(c, name) {
        C.token = C.token || randomCode(12);
        C.conn = c; C.partnerName = name;
        c.send({ t: 'accepted', token: C.token, name: myName() });
        closeDialog();
        status('Connected to ' + name, 'ok');
        notify('success', name + ' joined the conversation.');
    }

    // ---------- Guest: join someone's conversation from TexCom ----------
    C.join = async function (input) {
        const code = parseCode(input);
        if (!code) { status('That isn’t a conversation link or code.', 'bad'); return false; }
        if (C.active) C.end();
        C.role = 'guest'; C.ended = false; C.code = code; C.token = ''; C.partnerName = ''; C.retries = 0; C.attempt = null;
        status('Connecting…');
        const config = { iceServers: await iceServers() };
        if (C.ended) return false;
        C.peer = new Peer({ config, debug: 0 });
        C.peer.on('open', connectToHost);
        C.peer.on('disconnected', () => { if (!C.ended && C.peer && !C.peer.destroyed) C.peer.reconnect(); });
        C.peer.on('error', err => {
            if (C.ended) return;
            if (err.type === 'peer-unavailable' && !C.token && (C.retries || 0) >= 4) { // old link, never let in: stop
                C.end(true); openDialog('join'); status('That conversation isn’t open. Ask for a new link.', 'bad'); return;
            }
            status(err.type === 'peer-unavailable' ? 'That conversation isn’t open. Trying again…'
                : err.type === 'network' || err.type === 'server-error' ? 'No internet connection. Trying again…'
                : 'Connection problem (' + err.type + '). Trying again…', 'bad');
            retryLater();
        });
        return true;
    };

    // Retry after a failure, closing the failed attempt first (each attempt holds a browser WebRTC connection,
    // and browsers refuse new ones after a few hundred) and waiting longer each time: 3, 6, 12, 24, 30 s
    function retryLater() {
        clearTimeout(C.retryTimer);
        if (C.attempt && C.attempt !== C.conn) { try { C.attempt.close(); } catch (e) {} }
        C.attempt = null;
        C.retries = (C.retries || 0) + 1;
        C.retryTimer = setTimeout(connectToHost, Math.min(30000, 3000 * Math.pow(2, C.retries - 1)));
    }

    function connectToHost() {
        clearTimeout(C.retryTimer);
        if (C.ended || !C.peer || C.peer.destroyed || C.peer.disconnected) return;
        if (C.attempt && C.attempt !== C.conn) { try { C.attempt.close(); } catch (e) {} }
        const c = C.attempt = C.peer.connect(ID_PREFIX + C.code, { reliable: true });
        c.on('open', () => { C.retries = 0; c.send({ t: 'hello', name: myName(), app: 'texcom', token: C.token }); status('Waiting to be let in…'); });
        c.on('data', msg => {
            if (!msg || typeof msg !== 'object') return;
            if (msg.t === 'accepted') {
                C.token = msg.token || ''; C.partnerName = String(msg.name || 'Partner').slice(0, 40); C.conn = c;
                closeDialog(); status('Connected to ' + C.partnerName, 'ok');
                notify('success', 'You joined ' + C.partnerName + '’s conversation.');
            } else if (msg.t === 'declined') { C.end(true); notify('failure', 'They didn’t let you join.'); }
            else if (msg.t === 'busy') { C.end(true); notify('failure', 'That conversation already has a partner.'); }
            else if (c === C.conn) onMessage(msg);
        });
        c.on('close', () => {
            if (C.ended) return;
            if (c === C.conn) C.conn = null;
            status('Disconnected. Trying again…', 'bad');
            retryLater();
        });
    }

    // ---------- Both ----------
    function onMessage(msg) {
        if (msg.t === 'say' && typeof msg.text === 'string' && msg.text.trim()) {
            const text = msg.text.trim().slice(0, 2000);
            if (typeof appendToChatHistory === 'function') appendToChatHistory(text, true);
            if (params && params.readPartnerAloud && typeof speak === 'function') speak(text, true); // spoken, not sent back
        } else if (msg.t === 'bye') {
            const who = C.partnerName;
            C.end(true);
            notify('info', (who || 'Your partner') + ' ended the conversation.');
        }
    }

    // Called by speak(): the TexCom user's phrase goes to the partner
    C.send = function (text) {
        if (C.connected && text && text.trim()) C.conn.send({ t: 'say', text: text.trim() });
    };

    C.end = function (quiet) {
        clearTimeout(C.retryTimer);
        const wasActive = !C.ended;
        C.ended = true;
        try { if (C.conn && C.conn.open && !quiet) C.conn.send({ t: 'bye' }); } catch (e) {}
        const peer = C.peer, conn = C.conn;
        if (C.attempt && C.attempt !== conn) { try { C.attempt.close(); } catch (e) {} }
        C.attempt = null;
        C.conn = null; C.peer = null; C.token = ''; C.partnerName = '';
        setTimeout(() => { try { conn && conn.close(); } catch (e) {} try { peer && peer.destroy(); } catch (e) {} }, quiet ? 0 : 300);
        closeDialog();
        if (wasActive) updateBar();
    };

    // ---------- Dialog: invite (link, code, QR, share) or join ----------
    let qr = null;
    function openDialog(mode) {
        const d = document.getElementById('convDialog');
        if (!d) return;
        d.dataset.mode = mode;
        d.hidden = false;
        if (mode === 'join') {
            const input = document.getElementById('convJoinInput');
            input.value = ''; status('');
            setTimeout(() => input.focus(), 50);
        } else if (C.peer && C.peer.open) {
            showInvite();
        }
    }
    function closeDialog() { const d = document.getElementById('convDialog'); if (d) d.hidden = true; }
    function showInvite() {
        const link = inviteLink();
        document.getElementById('convLink').textContent = link;
        document.getElementById('convCode').textContent = C.code.slice(0, 4) + ' ' + C.code.slice(4);
        const box = document.getElementById('convQR');
        box.innerHTML = '';
        if (typeof QRCode !== 'undefined') qr = new QRCode(box, { text: link, width: 180, height: 180 });
    }

    C.shareLink = function () {
        const link = inviteLink();
        const text = myName() + ' would like to chat with you on TexCom: ' + link;
        if (navigator.share) { navigator.share({ title: 'TexCom conversation', text, url: link }).catch(() => {}); return; }
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TexCom) {
            window.webkit.messageHandlers.TexCom.postMessage({ m: 'ShareText:' + text }); return;
        }
        C.copyLink();
    };
    C.copyLink = function () {
        const link = inviteLink();
        const done = () => notify('success', 'Link copied.');
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, () => selectLink());
        else selectLink();
    };
    function selectLink() {
        const el = document.getElementById('convLink');
        const r = document.createRange(); r.selectNodeContents(el);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        try { document.execCommand('copy'); notify('success', 'Link copied.'); } catch (e) {}
    }

    document.addEventListener('DOMContentLoaded', () => {
        const d = document.getElementById('convDialog');
        if (!d) return;
        document.getElementById('convShare').onclick = C.shareLink;
        document.getElementById('convCopy').onclick = C.copyLink;
        document.getElementById('convClose').onclick = closeDialog;         // keeps waiting in the background
        document.getElementById('convEndInvite').onclick = () => C.end();
        document.getElementById('convJoinGo').onclick = async () => { if (await C.join(document.getElementById('convJoinInput').value)) {} };
        document.getElementById('convJoinInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('convJoinGo').click(); } });
        document.getElementById('convJoinCancel').onclick = () => { if (C.role === 'guest' && !C.connected) C.end(true); closeDialog(); };
        d.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); closeDialog(); } });
        d.addEventListener('click', e => { if (e.target === d) closeDialog(); });
        document.getElementById('convBarEnd').onclick = () => C.end();
        document.getElementById('convBarInvite').onclick = () => { if (C.role === 'host') openDialog('invite'); };
        window.addEventListener('beforeunload', () => { if (C.connected) try { C.conn.send({ t: 'bye' }); } catch (e) {} });
    });

    window.startConversation = () => C.start();
    window.openJoinConversation = () => openDialog('join');
})();
