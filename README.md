# Magik Alert

Standalone ComfyUI package containing **Magik Play Sound** and **Magik Notification**, under **Magik / Alerts**. No pysssss installation, configuration, Python dependencies, downloads, or legacy frontend installation is needed.

## Installation

Extract `Magik_Alert` into `ComfyUI/custom_nodes/`, restart ComfyUI, and refresh the browser. Keep the original pysssss nodes if existing workflows need them; these nodes have separate identifiers.

## Use

Connect `any` after the work to monitor. The same data is forwarded unchanged, including lists and image batches.

- **always**: alert when this node executes, even if later nodes are still running.
- **on empty queue**: arm the alert when this node executes; deliver after its prompt succeeds and the server reports an empty queue. Repeated executions of the same node coalesce to its latest settings. Different alert nodes remain independent. Failed/interrupted prompts discard their pending alerts; earlier successful prompts can still notify when the queue empties. Clearing queued jobs can also empty the queue.

Click **Test** on each node before a long run. Notification permission is requested only from **Enable notifications** or **Test**, and its result is awaited. The title area shows status; **Show alert status** displays the full message.

Sound volume is 0–1. The default `notify.mp3` is bundled. Put additional sound files in `js/assets/` and enter their filename, or supply an HTTP(S) URL. Relative paths resolve from `js/`. Local server filesystem paths are not browser URLs. Browser codec support and mixed-content rules apply.

## Reliability and limits

Uses ComfyUI API events (`executed`, `execution_start`, `execution_success`, `execution_error`, `execution_interrupted`, `status`, `reconnecting`), without polling or a fixed queue timeout. Requires a ComfyUI version that emits `execution_success`. Settings come from the actual backend execution, so subsequent widget edits do not change an armed alert. Unique event tokens suppress duplicate deliveries. Reconnection clears pending state to avoid stale alerts.

The browser must stay open and connected. Sound may require a user interaction or site autoplay permission. Notifications depend on browser/site permission, a supported secure context (localhost or HTTPS), and desktop notification settings. Each connected browser receiving these events can alert independently. These are browser alerts, not a headless desktop service. They do not notify about errors as a separate feature. Subgraph display IDs may have limited per-node status feedback depending on frontend mapping.

Pure backend and queue-state tests are included in the ZIP's `tests` directory; run from the extracted archive root with `python tests/backend.py` and `node tests/alerts.mjs`. Live browser/ComfyUI integration has not been tested here.

The bundled sound was supplied by the user from ComfyUI-Custom-Scripts. Retain upstream licensing requirements when redistributing that asset. The node implementation is newly written.
