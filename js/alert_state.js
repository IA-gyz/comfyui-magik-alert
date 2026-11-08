export class AlertState {
    constructor(deliver) { this.deliver = deliver; this.reset(); }
    reset() {
        this.queue = null; this.active = null;
        this.pending = new Map(); this.success = new Set(); this.seen = new Set();
    }
    start(id) { this.active = id; this.queue = null; }
    receive(id, node, payload) {
        if (!payload?.event_id || this.seen.has(payload.event_id)) return;
        this.seen.add(payload.event_id);
        if (this.seen.size > 4096) this.seen.delete(this.seen.values().next().value);
        if (payload.mode !== 'on empty queue') { this.deliver(node, payload); return; }
        if (!id) return;
        this.pending.set(String(node), {id, node, payload}); this.flush();
    }
    completed(id) {
        if (!id) return;
        if ([...this.pending.values()].some(item => item.id === id)) this.success.add(id);
        const retained = new Set([...this.pending.values()].map(item => item.id));
        for (const old of this.success) if (!retained.has(old)) this.success.delete(old);
        if (this.active === id) this.active = null;
        this.flush();
    }
    failed(id) {
        for (const [key, item] of this.pending) if (item.id === id) this.pending.delete(key);
        this.success.delete(id);
        if (this.active === id) this.active = null;
    }
    status(size) {
        if (!Number.isInteger(size) || size < 0) return;
        this.queue = size; this.flush();
    }
    flush() {
        if (this.queue !== 0 || this.active !== null) return;
        for (const [key, item] of this.pending) {
            if (!this.success.has(item.id)) continue;
            this.pending.delete(key); this.deliver(item.node, item.payload);
        }
        const retained = new Set([...this.pending.values()].map(x => x.id));
        for (const id of this.success) if (!retained.has(id)) this.success.delete(id);
    }
}
