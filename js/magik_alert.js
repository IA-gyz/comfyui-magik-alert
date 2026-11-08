import { app } from '../../../scripts/app.js';
import { api } from '../../../scripts/api.js';
import { AlertState } from './alert_state.js';
const types = new Set(['MagikPlaySound', 'MagikNotification']);
function status(node, text, error = false) {
    if (node) { node._magikAlertStatus = { text, error }; node.setDirtyCanvas?.(true, true); }
    if (error) console.warn('[Magik Alert]', text);
}
function audioURL(file) {
    const text = String(file || 'notify.mp3').trim() || 'notify.mp3';
    const url = new URL(text.includes('/') || text.includes(':') ? text : 'assets/' + text, import.meta.url);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use an HTTP(S) sound URL or a bundled asset filename.');
    return url;
}
async function permission() {
    if (!('Notification' in window)) throw new Error('Notifications unavailable in this browser/context.');
    const result = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (result !== 'granted') throw new Error('Notifications blocked. Enable them in browser site permissions.');
}
const playing = new Set();
async function deliver(id, payload) {
    const node = app.graph?.getNodeById(id);
    try {
        if (payload.kind === 'sound') {
            const audio = new Audio(audioURL(payload.file).href);
            audio.volume = Math.min(1, Math.max(0, Number(payload.volume) || 0));
            playing.add(audio);
            let released = false;
            const release = () => {
                if (released) return;
                released = true; playing.delete(audio); audio.removeAttribute('src'); audio.load();
            };
            audio.addEventListener('ended', release, { once: true });
            audio.addEventListener('error', () => {
                status(node, 'Sound failed: check URL, format, and browser permissions.', true); release();
            }, { once: true });
            try { await audio.play(); } catch (error) { release(); throw error; }
            status(node, 'Playing sound');
        } else {
            if (!('Notification' in window) || Notification.permission !== 'granted') throw new Error('Click Enable notifications on this node first.');
            const notification = new Notification('ComfyUI', {body: String(payload.message ?? ''), tag: 'magik-alert-' + id});
            notification.onerror = () => status(node, 'Browser could not display the notification.', true);
            status(node, 'Notification sent');
        }
    } catch (error) { status(node, String(error.message || error), true); }
}
const state = new AlertState((id, payload) => { void deliver(id, payload); });
const value = (node, name, fallback) => node.widgets?.find(w => w.name === name)?.value ?? fallback;
app.registerExtension({
    name: 'Magik.Alert',
    setup() {
        api.addEventListener('execution_start', e => state.start(e.detail.prompt_id));
        api.addEventListener('executed', e => {
            const d = e.detail;
            if (!Array.isArray(d.output?.magik_alert)) return;
            for (const payload of d.output.magik_alert) state.receive(d.prompt_id ?? state.active, d.display_node ?? d.node, payload);
        });
        api.addEventListener('execution_success', e => state.completed(e.detail.prompt_id));
        for (const name of ['execution_error', 'execution_interrupted']) api.addEventListener(name, e => state.failed(e.detail.prompt_id ?? state.active));
        api.addEventListener('status', e => state.status(e.detail?.status?.exec_info?.queue_remaining));
        api.addEventListener('reconnecting', () => state.reset());
    },
    beforeRegisterNodeDef(nodeType, nodeData) {
        if (!types.has(nodeData.name)) return;
        const created = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = created?.apply(this, arguments);
            if (nodeData.name === 'MagikNotification') this.addWidget('button', 'Enable notifications', null, async () => {
                try { await permission(); status(this, 'Notifications enabled'); }
                catch (error) { status(this, error.message, true); }
            }, { serialize: false });
            this.addWidget('button', 'Test', null, async () => {
                if (nodeData.name === 'MagikPlaySound') {
                    await deliver(this.id, {kind: 'sound', file: value(this, 'file', 'notify.mp3'), volume: value(this, 'volume', 0.5)});
                } else {
                    try { await permission(); await deliver(this.id, {kind: 'notification', message: value(this, 'message', 'Test notification')}); }
                    catch (error) { status(this, error.message, true); }
                }
            }, { serialize: false });
            this.addWidget('button', 'Show alert status', null, () => window.alert(this._magikAlertStatus?.text || 'Ready. Use Test to check output.'), { serialize: false });
            return result;
        };
        const draw = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx) {
            draw?.apply(this, arguments);
            if (this.flags?.collapsed || !this._magikAlertStatus) return;
            ctx.save(); ctx.fillStyle = this._magikAlertStatus.error ? '#ff7979' : '#8cddaa'; ctx.font = '12px sans-serif';
            const text = this._magikAlertStatus.text;
            ctx.fillText(text.length > 48 ? text.slice(0, 45) + '…' : text, 8, -7, this.size[0] - 16); ctx.restore();
        };
    },
});
