const CryptoUtil = {
    encrypt(text, key) {
        if (!key) {
            throw new Error("Encryption key is required");
        }
        return CryptoJS.AES.encrypt(text, key).toString();
    },

    decrypt(ciphertext, key) {
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, key);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch {
            return null;
        }
    }
};

export default CryptoUtil;
