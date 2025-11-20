class TelegramService {
    constructor() {
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    async sendMessage(chatId, text) {
        if (!this.token) throw new Error("Telegram token not set.");

        const url = `https://api.telegram.org/bot${this.token}/sendMessage`;

        const res = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: "HTML"
            })
        });

        const data = await res.json();

        if (!data.ok) {
            throw new Error(`Telegram Error: ${data.description}`);
        }

        return data;
    }
}

export default new TelegramService();
