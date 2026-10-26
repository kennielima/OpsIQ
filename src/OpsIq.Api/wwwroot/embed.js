(function () {
    const script = document.currentScript;
    const apiKey = script.getAttribute('data-key');
    const apiUrl = script.getAttribute('data-url') || 'http://localhost:5088';

    if (!apiKey) return;

    let sessionId = localStorage.getItem('opsiq_session');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('opsiq_session', sessionId);
    }

    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
        <style>
            #widget-btn {
                position: fixed; bottom: 24px; right: 24px;
                background: #0070f3; color: white; border: none;
                border-radius: 50%; width: 56px; height: 56px;
                font-size: 24px; cursor: pointer; z-index: 9999;
            }
            #widget-panel {
                display: none; position: fixed; bottom: 90px; right: 24px;
                width: 320px; background: white; border: 1px solid #eee;
                border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);
                padding: 16px; z-index: 9999; flex-direction: column; gap: 8px;
            }
            #widget-panel.open { display: flex; }
            #widget-messages {
                min-height: 200px; max-height: 300px; overflow-y: auto;
                display: flex; flex-direction: column; gap: 8px;
            }
            .msg { padding: 8px; background: #f5f5f5; border-radius: 8px; font-size: 14px; }
            .msg.user { background: #0070f3; color: white; align-self: flex-end; }
            .sources { font-size: 12px; color: #888; }
            #widget-input {
                width: 100%; padding: 8px; border: 1px solid #eee;
                border-radius: 8px; box-sizing: border-box; font-size: 14px;
            }
            #widget-submit {
                background: #0070f3; color: white; border: none;
                border-radius: 8px; padding: 8px; cursor: pointer; font-size: 14px;
            }
            #widget-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        </style>
        <button id="widget-btn">💬</button>
        <div id="widget-panel">
            <div id="widget-messages"></div>
            <input id="widget-input" placeholder="Ask a question..." maxlength="500" />
            <button id="widget-submit">Send</button>
        </div>
    `;

    const btn = shadow.getElementById('widget-btn');
    const panel = shadow.getElementById('widget-panel');
    const input = shadow.getElementById('widget-input');
    const messages = shadow.getElementById('widget-messages');
    const submit = shadow.getElementById('widget-submit');

    btn.addEventListener('click', () => panel.classList.toggle('open'));

    submit.addEventListener('click', async () => {
        const question = input.value.trim();
        if (!question) return;

        input.value = '';
        submit.disabled = true;

        const userMsg = document.createElement('div');
        userMsg.className = 'msg user';
        userMsg.textContent = question;
        messages.appendChild(userMsg);
        messages.scrollTop = messages.scrollHeight;

        try {
            const res = await fetch(`${apiUrl}/api/widget/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': apiKey
                },
                body: JSON.stringify({ question, sessionId })
            });

            if (!res.ok) {
                const err = document.createElement('div');
                err.className = 'msg';
                err.textContent = res.status === 429 ? 'Rate limit exceeded. Try again later.' : 'Something went wrong.';
                messages.appendChild(err);
                return;
            }

            const data = await res.json();

            const msg = document.createElement('div');
            msg.className = 'msg';
            msg.textContent = data.answer;
            messages.appendChild(msg);

            if (data.sources?.length) {
                const sources = document.createElement('div');
                sources.className = 'sources';
                sources.textContent = 'Sources: ' + data.sources.map(s => s.title).join(', ');
                messages.appendChild(sources);
            }

            messages.scrollTop = messages.scrollHeight;
        } finally {
            submit.disabled = false;
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit.click();
    });
})();
