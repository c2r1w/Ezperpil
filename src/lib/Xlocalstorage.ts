export const XlocalStorage = {
    async getItem(key: string) {
        const res = await fetch(`/api/localstorageM?key=${encodeURIComponent(key)}`);
        if (!res.ok) return undefined;
        const data = await res.json();
        return data.value ?? undefined;
    },

    async setItem(key: string, value: string) {
        const res = await fetch('/api/localstorageM', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
        });
        return res.ok;
    },

    async removeItem(key: string) {
        const res = await fetch(`/api/localstorageM?key=${encodeURIComponent(key)}`, {
            method: 'DELETE'
        });
        return res.ok;
    }
};
