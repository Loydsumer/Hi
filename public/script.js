document.addEventListener('DOMContentLoaded', init);

let globalConfig = null;
let toastTimeout;

async function init() {
    try {
        const response = await fetch('/config');
        globalConfig = await response.json();
        
        setUi(globalConfig);
        loadEnd(globalConfig.tags);
        
        await kuroneko(globalConfig);
        
        loadReminder();
        setSearch();
        fallingFlower();
    } catch (e) {
        document.getElementById('term-logs').innerHTML = `<span class="term-error font-bold bg-red-100 px-1">FATAL ERROR: SYSTEM FAILURE</span><br>${e.message}`;
    }
}

async function loadReminder() {
    try {
        const req = await fetch('../src/reminder.json');
        const data = await req.json();
        if(data?.message) {
            document.getElementById('running-text').innerText = data.message.toUpperCase();
        }
    } catch (e) { console.warn("No reminder config found"); }
}

function messeg(msg) {
    const toast = document.getElementById('custom-toast');
    const msgBox = document.getElementById('toast-message');
    
    msgBox.innerText = msg;
    toast.classList.remove('translate-y-32', 'opacity-0');
    
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('translate-y-32', 'opacity-0');
    }, 3000);
}

function terminalLog(message, type = 'info') {
    const logs = document.getElementById('term-logs');
    const line = document.createElement('div');
    const time = new Date().toLocaleTimeString('en-US', {hour12: false, hour: "2-digit", minute:"2-digit", second:"2-digit"});
    
    let prefix = `<span class="text-primary/60 font-bold">[${time}]</span>`;
    
    if (type === 'error') {
        prefix += ` <span class="term-error font-bold">ERR</span>`;
        line.className = "term-error";
    } else if (type === 'success') {
        prefix += ` <span class="term-success font-bold">OK</span>`;
        line.className = "term-success";
    } else if (type === 'warn') {
        prefix += ` <span class="term-warn font-bold">WARN</span>`;
        line.className = "term-warn";
    } else if (type === 'req-success') {
        line.className = "term-success"; 
    } else if (type === 'req-error') {
        line.className = "term-error";
    } else {
        prefix += ` <span class="term-info font-bold">INFO</span>`;
        line.className = "term-info";
    }

    line.innerHTML = `${prefix} ${message}`;
    logs.appendChild(line);
    logs.scrollTop = logs.scrollHeight;
}

async function kuroneko(config) {
    const logs = document.getElementById('term-logs');
    
    const cmdLine = document.createElement('div');
    cmdLine.className = "mb-2 break-all flex flex-wrap items-center";
    
    const prompt = document.createElement('span');
    prompt.className = "text-green-500 font-bold mr-2";
    prompt.innerHTML = "root@danzz:~/nekoapy#";
    
    const inputCmd = document.createElement('span');
    inputCmd.className = "text-black font-mono relative";
    
    const cursor = document.createElement('span');
    cursor.className = "inline-block w-2.5 h-4 bg-green-500 align-middle ml-0.5 animate-pulse";
    
    cmdLine.appendChild(prompt);
    cmdLine.appendChild(inputCmd);
    inputCmd.appendChild(cursor);
    logs.appendChild(cmdLine);

    const cmd = "npm run dev";
    
    await new Promise(r => setTimeout(r, 600));

    for (let char of cmd) {
        const randomSpeed = Math.floor(Math.random() * (120 - 40 + 1)) + 40;
        await new Promise(r => setTimeout(r, randomSpeed));
        
        const textNode = document.createTextNode(char);
        inputCmd.insertBefore(textNode, cursor);
    }
    
    await new Promise(r => setTimeout(r, 500));
    cursor.remove();
    
    const printRaw = (text) => {
        const div = document.createElement('div');
        div.className = "text-primary/70 text-xs font-mono ml-1";
        div.innerText = text;
        logs.appendChild(div);
        logs.scrollTop = logs.scrollHeight;
    };

    const version = config.settings.apiVersion || '1.0.0';

    printRaw(`\n> nekoapy@${version} dev`);
    await new Promise(r => setTimeout(r, Math.random() * 100 + 50));
    printRaw(`> node src/index.ts\n`);
    await new Promise(r => setTimeout(r, Math.random() * 300 + 200));
    
    const endpoints = Object.values(config.tags).flat();
    const total = endpoints.length;
    
    terminalLog("Reading environment config...", 'info');
    await new Promise(r => setTimeout(r, Math.random() * 300 + 150));
    
    terminalLog(`Loaded configuration: production`, 'info');
    await new Promise(r => setTimeout(r, Math.random() * 200 + 100));
    
    terminalLog(`Loaded ${total} routes to express app...`, 'warn');
    
    let count = 0;
    const maxShow = 5;
    for (const route of endpoints) {
        if(count < maxShow) {
             terminalLog(`mapped {${route.method}} ${route.endpoint}`, 'success');
             await new Promise(r => setTimeout(r, Math.random() * 50 + 20));
        }
        count++;
    }
    if(count > maxShow) terminalLog(`... +${count - maxShow} hidden endpoints mapped`, 'info');

    await new Promise(r => setTimeout(r, 400));
    
    const serverUrl = window.location.origin;
    terminalLog(`Server is running at ${serverUrl}`, 'success');

    document.getElementById('term-input-line').classList.remove('hidden');
    
    const container = document.getElementById('api-container');
    container.classList.remove('opacity-0', 'translate-y-4');
}

function setUi(config) {
    const s = config.settings;
    document.getElementById('nav-title').innerText = s.apiName || 'API';
    document.getElementById('stat-visitors').innerText = s.visitors || '1';
    document.getElementById('stat-version').innerText = s.apiVersion || '1.0';
    document.getElementById('api-desc').innerText = s.description || 'System online.';

    if (s.favicon) {
        let link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.rel = 'icon';
        link.href = s.favicon;
        document.head.appendChild(link);
    }
    
    const total = Object.values(config.tags).reduce((acc, curr) => acc + curr.length, 0);
    document.getElementById('stat-endpoints').innerText = total;
}

function setSearch() {
    const input = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');

    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        let hasVisible = false;

        document.querySelectorAll('.api-card-wrapper').forEach(el => {
            const txt = el.getAttribute('data-search').toLowerCase();
            if (txt.includes(val)) {
                el.classList.remove('hidden');
                hasVisible = true;
            } else {
                el.classList.add('hidden');
            }
        });

        document.querySelectorAll('.api-section').forEach(sec => {
            const cards = sec.querySelectorAll('.api-card-wrapper:not(.hidden)');
            sec.classList.toggle('hidden', cards.length === 0);
        });

        noResults.classList.toggle('hidden', hasVisible);
        noResults.classList.toggle('flex', !hasVisible);
    });
}

function loadEnd(tags) {
    const container = document.getElementById('api-container');
    container.innerHTML = '';

    for (const [cat, routes] of Object.entries(tags)) {
        const section = document.createElement('div');
        section.className = "api-section mb-12";
        section.innerHTML = `
            <div class="flex items-center gap-4 mb-6 sticky top-16 z-30 bg-bg-main/90 backdrop-blur-sm py-2">
                <div class="w-4 h-4 bg-gradient-to-br from-primary to-sky-blue rounded-full"></div>
                <h2 class="text-2xl font-display font-bold uppercase text-primary">
                    ${cat}
                </h2>
                <div class="h-[2px] bg-gradient-to-r from-primary to-sky-blue flex-1"></div>
                <span class="text-xs font-mono font-bold bg-gradient-to-r from-primary to-sky-blue text-white px-2 py-1 rounded-full">${routes.length} EP</span>
            </div>
        `;
        
        const grid = document.createElement('div');
        grid.className = 'grid gap-6';

        routes.forEach((route, idx) => {
            const id = `${cat}-${idx}`.replace(/\s+/g, '-');
            const searchTerms = `${route.name} ${route.endpoint} ${cat}`;
            
            let inputsHtml = '';
            if (route.params?.length) {
                inputsHtml = `<div class="bg-gradient-to-b from-white to-sky-blue/10 p-4 border-t-2 border-primary/20 grid gap-4">` + 
                route.params.map(p => 
                    `<div class="relative">
                        <div class="flex justify-between items-center mb-1.5">
                            <label class="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                <span class="w-2 h-2 bg-primary rounded-full inline-block"></span> ${p.name.toUpperCase()}
                            </label>
                            <span class="text-[9px] font-bold tracking-wide ${p.required ? 'text-white bg-gradient-to-r from-red-500 to-pink-500 px-1.5 py-0.5 rounded' : 'text-primary bg-primary/10 px-1.5 py-0.5 border border-primary/30 rounded'}">${p.required ? 'REQ' : 'OPT'}</span>
                        </div>
                        <input type="text" id="input-${id}-${p.name}" placeholder="${p.description || 'Value...'}" 
                        class="w-full border-2 border-primary/30 p-2.5 font-mono text-xs focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all shadow-sm placeholder:text-primary/40 bg-white/80 rounded">
                     </div>`
                ).join('') + `</div>`;
            }

            const methodColor = route.method === 'GET' ? 'bg-gradient-to-r from-sky-blue to-primary' : 
                               route.method === 'POST' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                               route.method === 'PUT' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                               route.method === 'DELETE' ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-primary to-purple-600';
            
            const card = document.createElement('div');
            card.className = 'api-card-wrapper bg-white/80 backdrop-blur-sm border-2 border-primary/30 shadow-hard hover:shadow-hard-hover transition-all duration-200 group relative rounded-lg';
            card.setAttribute('data-search', searchTerms);
            
            card.innerHTML = `
                <div class="p-4 cursor-pointer select-none" onclick="toggle('${id}')">
                    <div class="flex justify-between items-center gap-4">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <span class="px-2 py-1 text-[10px] font-bold text-white ${methodColor} border border-white/50 shadow-[2px_2px_0px_0px_rgba(139,92,246,0.3)] shrink-0 font-mono tracking-wider rounded">${route.method}</span>
                            <code class="font-bold text-sm sm:text-base truncate font-mono text-primary group-hover:text-sky-blue transition-colors bg-primary/5 px-2 py-0.5 border border-primary/20 group-hover:border-primary rounded">${route.endpoint}</code>
                        </div>
                        <div class="w-8 h-8 flex items-center justify-center border-2 border-primary/30 bg-white group-hover:bg-primary/10 transition-colors shadow-sm rounded-lg">
                             <i id="icon-${id}" class="fa-solid fa-plus text-sm transition-transform duration-300 text-primary"></i>
                        </div>
                    </div>
                    <p class="text-xs text-primary/70 mt-3 font-mono leading-relaxed pl-1">${route.name}</p>
                </div>
                
                <div id="body-${id}" class="hidden animate-fade-in">
                    ${inputsHtml}
                    
                    <div class="p-3 flex gap-3 border-t-2 border-primary/20 bg-gradient-to-r from-white to-primary/5">
                        <button onclick="testReq(this, '${route.endpoint}', '${route.method}', '${id}')" class="flex-1 bg-gradient-to-r from-primary to-sky-blue text-white font-bold py-2.5 hover:from-sky-blue hover:to-primary border-2 border-primary/50 transition-all shadow-[2px_2px_0px_0px_rgba(139,92,246,0.3)] active:translate-y-[2px] active:shadow-none text-xs tracking-widest uppercase rounded disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fa-solid fa-bolt mr-2"></i> Execute
                        </button>
                        <button onclick="copy('${route.endpoint}')" class="px-4 border-2 border-primary/30 bg-white hover:bg-primary/10 active:scale-95 transition-transform rounded" title="Copy URL">
                            <i class="fa-regular fa-copy text-primary"></i>
                        </button>
                    </div>

                    <div id="res-area-${id}" class="hidden border-t-4 border-primary/30 bg-code-bg text-[10px] relative rounded-b-lg">
                        <div class="flex justify-between items-center bg-gradient-to-r from-primary/10 to-sky-blue/10 px-4 py-2 border-b border-primary/30">
                            <div class="flex gap-3 items-center">
                                <span class="w-2 h-2 rounded-full bg-gradient-to-r from-red-400 to-pink-500"></span>
                                <span class="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"></span>
                                <span id="status-${id}" class="text-primary/70 font-bold ml-2">IDLE</span>
                            </div>
                            <div class="flex gap-3 text-primary/70">
                                <span id="time-${id}">--ms</span>
                            </div>
                        </div>
                        
                        <div class="absolute top-2 right-2 flex gap-2 z-20">
                             <a id="dl-btn-${id}" class="hidden bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-600 border border-green-400/30 px-2 py-0.5 hover:bg-green-500/30 cursor-pointer rounded"><i class="fa-solid fa-download"></i></a>
                             <button onclick="copyRes('${id}')" class="bg-gradient-to-r from-blue-500/20 to-sky-blue/20 text-sky-blue border border-sky-blue/30 px-2 py-0.5 hover:bg-sky-blue/30 rounded"><i class="fa-regular fa-clone"></i></button>
                             <button onclick="reset('${id}')" class="bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-600 border border-red-400/30 px-2 py-0.5 hover:bg-red-500/30 rounded"><i class="fa-solid fa-xmark"></i></button>
                        </div>

                        <div id="output-${id}" class="font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-[400px] p-4 custom-scrollbar min-h-[80px] text-primary/80 bg-white/50 rounded-b-lg"></div>
                    </div>
                </div>`;
            grid.appendChild(card);
        });
        section.appendChild(grid);
        container.appendChild(section);
    }
}

window.toggle = (id) => {
    const b = document.getElementById(`body-${id}`);
    const i = document.getElementById(`icon-${id}`);
    
    if (b.classList.contains('hidden')) {
        b.classList.remove('hidden');
        i.classList.add('rotate-45'); 
    } else {
        b.classList.add('hidden');
        i.classList.remove('rotate-45');
    }
};

window.copy = (txt) => {
    navigator.clipboard.writeText(window.location.origin + txt);
    messeg("ENDPOINT COPIED");
    terminalLog(`Copied URL: ${txt}`);
};

window.copyRes = (id) => {
    const out = document.getElementById(`output-${id}`);
    if (!out.innerText) return;
    navigator.clipboard.writeText(out.innerText);
    messeg("RESPONSE COPIED");
};

window.reset = (id) => {
    document.getElementById(`res-area-${id}`).classList.add('hidden');
    document.getElementById(`output-${id}`).innerHTML = '';
    document.getElementById(`dl-btn-${id}`).classList.add('hidden');
    document.querySelectorAll(`[id^="input-${id}-"]`).forEach(i => i.value = '');
    terminalLog(`Console cleared for req-${id.split('-').pop()}`);
};

window.testReq = async (btn, url, method, id) => {
    if (btn.disabled) return;

    const out = document.getElementById(`output-${id}`);
    const status = document.getElementById(`status-${id}`);
    const time = document.getElementById(`time-${id}`);
    const dlBtn = document.getElementById(`dl-btn-${id}`);
    
    const originalBtnText = '<i class="fa-solid fa-bolt mr-2"></i> Execute';
    
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    
    let elapsedSeconds = 0;
    btn.innerText = `WAIT ${elapsedSeconds}s`;

    const timerInterval = setInterval(() => {
        elapsedSeconds++;
        btn.innerText = `WAIT ${elapsedSeconds}s`;
    }, 1000);
    
    document.getElementById(`res-area-${id}`).classList.remove('hidden');
    
    dlBtn.classList.add('hidden');
    dlBtn.href = '#';
    out.innerHTML = '<span class="text-primary/50 animate-pulse">Sending packets...</span>';
    
    const params = {};
    document.querySelectorAll(`[id^="input-${id}-"]`).forEach(i => {
        if(i.value) params[i.id.split(`input-${id}-`)[1]] = i.value;
    });

    let fetchUrl = url + (method === 'GET' && Object.keys(params).length ? '?' + new URLSearchParams(params) : '');
    let opts = { method, ...(method !== 'GET' ? { headers: {'Content-Type': 'application/json'}, body: JSON.stringify(params) } : {}) };

    const fullUrl = fetchUrl.startsWith('http') ? fetchUrl : window.location.origin + fetchUrl;

    const start = performance.now();
    try {
        const req = await fetch(fetchUrl, opts);
        const end = performance.now();
        const duration = (end - start).toFixed(0);
        
        status.innerText = `${req.status} ${req.statusText}`;
        status.className = req.ok ? 'text-green-600 font-bold ml-2' : 'text-red-600 font-bold ml-2';
        time.innerText = `${duration}ms`;

        terminalLog(`[${req.status}] ${fullUrl}`, req.ok ? 'req-success' : 'req-error');

        const type = req.headers.get('content-type');
        if (type?.includes('json')) {
            const json = await req.json();
            out.innerHTML = syntaxHighlight(json);
        } else if (type?.startsWith('image')) {
            const blob = await req.blob();
            const urlObj = URL.createObjectURL(blob);
            dlBtn.href = urlObj;
            dlBtn.download = `img-${Date.now()}.jpg`;
            dlBtn.classList.remove('hidden');
            
            out.innerHTML = `
                <div class="border border-dashed border-primary/30 p-2 bg-white/50 rounded-lg flex justify-center">
                    <img src="${urlObj}" class="max-w-full shadow-lg max-h-[300px] rounded">
                </div>`;
        } else if (type?.includes('audio')) {
            const blob = await req.blob();
             out.innerHTML = `<audio controls src="${URL.createObjectURL(blob)}" class="w-full mt-2 rounded"></audio>`;
        } else {
            out.innerText = await req.text();
        }
    } catch (err) {
        out.innerHTML = `<span class="text-red-600 font-bold">CONNECTION_REFUSED</span><br><span class="text-primary/60">${err.message}</span>`;
        status.innerText = 'ERR';
        status.className = 'text-red-600 font-bold ml-2';
        terminalLog(`Fetch Failed: ${err.message}`, 'error');
    } finally {
        clearInterval(timerInterval);
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
};

function syntaxHighlight(json) {
    if (typeof json != 'string') json = JSON.stringify(json, undefined, 2);
    return json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) cls = 'json-key';
            else cls = 'json-string';
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
    });
}

function fallingFlower() {
    const container = document.getElementById('falling-flowers-container');
    
    if(!container) return;

    const yourFavoriteFlower = [
        'https://c.termai.cc/i193/Zuhw5.png',
        'https://c.termai.cc/i151/ScGW.png',
        'https://c.termai.cc/i156/QVY3n.png'
    ];
    function createFlower() {
        const flower = document.createElement('div');
        flower.classList.add('falling-flower');
        
        const randomIndex = Math.floor(Math.random() * yourFavoriteFlower.length);
        const selectedUrl = yourFavoriteFlower[randomIndex];
        flower.style.backgroundImage = `url('${selectedUrl}')`;
        
        const left = Math.random() * 90; 
        flower.style.left = `${left}vw`;
        
        const size = 15 + Math.random() * 15;
        flower.style.width = `${size}px`;
        flower.style.height = `${size}px`;
        const fallDuration = 8 + Math.random() * 7;
        const swayDuration = 3 + Math.random() * 3;
        flower.style.animation = `fall ${fallDuration}s linear forwards, sway ${swayDuration}s ease-in-out infinite`;
        const delay = Math.random() * 5;
        flower.style.animationDelay = `${delay}s`;
        container.appendChild(flower);
        setTimeout(() => {
            if (flower.parentNode) {
                flower.remove();
            }
        }, (fallDuration + delay) * 1000);
    }
    
    setInterval(createFlower, 1000 + Math.random() * 1000);
    
    for (let i = 0; i < 5; i++) {
        setTimeout(createFlower, i * 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('music-widget');
    const toggleBtn = document.getElementById('music-toggle');
    const audio = document.getElementById('audio-player');
    const playBtn = document.getElementById('btn-play');
    const playIcon = playBtn.querySelector('i');
    const cover = document.getElementById('music-cover-container').querySelector('img');
    
    let isPlaying = false;
    let isOpen = false;

    function toggleWidget() {
        isOpen = !isOpen;
        if (isOpen) {
            widget.classList.remove('translate-x-[calc(100%-2.5rem)]', 'md:translate-x-[calc(100%-3rem)]');
            widget.classList.add('translate-x-0');
        } else {
            widget.classList.remove('translate-x-0');
            widget.classList.add('translate-x-[calc(100%-2.5rem)]', 'md:translate-x-[calc(100%-3rem)]');
        }
    }

    toggleBtn.addEventListener('click', toggleWidget);

    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            playIcon.classList.replace('fa-pause', 'fa-play');
            cover.parentElement.classList.remove('animate-spin-slow');
        } else {
            audio.play().catch(e => console.log("Audio play blocked", e));
            playIcon.classList.replace('fa-play', 'fa-pause');
            cover.parentElement.classList.add('animate-spin-slow');
            if(!isOpen) toggleWidget();
        }
        isPlaying = !isPlaying;
    });

    audio.addEventListener('timeupdate', () => {
        const pct = (audio.currentTime / audio.duration) * 100;
        document.getElementById('progress-bar').style.width = `${pct}%`;
    });

    audio.addEventListener('ended', () => {
        isPlaying = false;
        playIcon.classList.replace('fa-pause', 'fa-play');
        cover.parentElement.classList.remove('animate-spin-slow');
        document.getElementById('progress-bar').style.width = '0%';
    });

    document.getElementById('progress-container').addEventListener('click', (e) => {
        const width = e.target.clientWidth;
        const clickX = e.offsetX;
        audio.currentTime = (clickX / width) * audio.duration;
    });

    const mascotWidget = document.getElementById('mascot-widget');
    const mascotBubble = document.getElementById('mascot-bubble');
    const mascotText = document.getElementById('mascot-text');
    
    const messages = [
        "hay welcome :)",
        "welcome to my rest apis ^•^",
        ":D",
        "humm ?"
    ];
    let msgIndex = 0;
    let bubbleTimeout;

    mascotWidget.addEventListener('click', () => {
        if (bubbleTimeout) clearTimeout(bubbleTimeout);

        const isHidden = mascotBubble.classList.contains('opacity-0');

        if (isHidden) {
            mascotText.innerText = messages[msgIndex];
            mascotBubble.classList.remove('opacity-0', 'translate-x-4', 'pointer-events-none');
            
            msgIndex = (msgIndex + 1) % messages.length;

            bubbleTimeout = setTimeout(() => {
                mascotBubble.classList.add('opacity-0', 'translate-x-4', 'pointer-events-none');
            }, 4000);
        } else {
            mascotBubble.classList.add('opacity-0', 'translate-x-4', 'pointer-events-none');
        }
    });
});
