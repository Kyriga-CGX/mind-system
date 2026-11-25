import { Plugin, TitlebarItem } from "@opencode/plugin/gui"
import { Rpc } from "@opencode/plugin/rpc"
import { createSignal, For, Show, type JSX } from "solid-js"

// ── Contratto RPC ─────────────────────────────────────────────
// Gemello locale del contratto di T1 (`src/rpc.ts`, non ancora committato
// al momento di T3). Shape identico alla spec approvata
// `docs/specs/2026-11-25-mind-sync-button-design.md`:
//   status({ remote? }) → { installed, installedOn, head, proposals[], behindOrigin }
//   sync()              → { commit, date, backup }
// Quando T1 atterra, sostituire con `import { MindSyncStatus } from "./rpc.js"`
// e cancellare questo blocco: la GUI consuma solo quello shape.
// Nota tipi: gli schema sono i JSON Schema letterali dell'esempio ufficiale
// (https://opencode.ai/docs/build/plugins/rpc); l'asserzione a
// `PortableDefinition` colma solo il branding nominale di effect, a runtime
// l'oggetto è identico. I metodi restano `unknown` in TS e vengono
// ristretti da `narrowSnapshot`/`narrowResult`.
const twin = {
  id: "mind-sync-status",
  methods: {
    status: {
      input: {
        type: "object",
        properties: { remote: { type: "boolean" } },
        additionalProperties: false,
      },
      output: {
        type: "object",
        properties: {
          installed: { type: ["string", "null"] },
          installedOn: { type: ["string", "null"] },
          head: { type: "string" },
          proposals: { type: "array", items: { type: "string" } },
          behindOrigin: { type: ["number", "null"] },
        },
        required: ["head", "proposals"],
        additionalProperties: false,
      },
    },
    sync: {
      input: { type: "object", additionalProperties: false },
      output: {
        type: "object",
        properties: {
          commit: { type: "string" },
          date: { type: "string" },
          backup: { type: "string" },
        },
        required: ["commit", "date", "backup"],
        additionalProperties: false,
      },
    },
  },
} as const

export const MindSyncStatus: Rpc.PortableDefinition = Rpc.define(
  twin as unknown as Parameters<typeof Rpc.define>[0],
) as unknown as Rpc.PortableDefinition

export interface SyncSnapshot {
  installed: string | null
  installedOn: string | null
  head: string
  proposals: string[]
  behindOrigin: number | null
}

export interface SyncResult {
  commit: string
  date: string
  backup: string
}

/** Restringe la risposta JSON Schema (`unknown` in TS) allo shape di spec. */
export function narrowSnapshot(raw: unknown): SyncSnapshot {
  const o = raw as Record<string, unknown>
  if (typeof o !== "object" || o === null || typeof o.head !== "string") {
    throw new Error("risposta status() non valida")
  }
  const proposals = Array.isArray(o.proposals)
    ? o.proposals.filter((p): p is string => typeof p === "string")
    : []
  return {
    installed: typeof o.installed === "string" ? o.installed : null,
    installedOn: typeof o.installedOn === "string" ? o.installedOn : null,
    head: o.head,
    proposals,
    behindOrigin: typeof o.behindOrigin === "number" ? o.behindOrigin : null,
  }
}

export function narrowResult(raw: unknown): SyncResult {
  const o = raw as Record<string, unknown>
  if (
    typeof o !== "object" ||
    o === null ||
    typeof o.commit !== "string" ||
    typeof o.date !== "string" ||
    typeof o.backup !== "string"
  ) {
    throw new Error("risposta sync() non valida")
  }
  return { commit: o.commit, date: o.date, backup: o.backup }
}

/** Matrice stati pill (spec § Testing): allineato → OK, tutto il resto → UPDATE. */
export function needsUpdate(s: SyncSnapshot): boolean {
  if (s.installed === null || s.installed !== s.head) return true
  if (s.proposals.length > 0) return true
  return (s.behindOrigin ?? 0) > 0
}

export function pillLabel(s: SyncSnapshot | null, verifying: boolean): string {
  if (verifying || s === null) return "MIND · …"
  return needsUpdate(s) ? "MIND · UPDATE" : "MIND · OK"
}

export function shortHash(full: string): string {
  return full.slice(0, 7)
}

export function fmtErr(err: unknown): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === "string" && m.length > 0) return m
  }
  return String(err)
}

// ── Stile FILO MINIMALE (dal mockup approvato, stessi token) ──
const LINE = "#ece7d9"
const MUTED = "#8a8474"

function Row(props: { label: string; children: JSX.Element }) {
  return (
    <div
      style={{
        display: "flex",
        "justify-content": "space-between",
        gap: "8px",
        padding: "5px 0",
        "border-bottom": `1px dotted ${LINE}`,
        "font-size": "11px",
      }}
    >
      <span style={{ color: MUTED }}>{props.label}</span>
      <b style={{ "font-weight": 600, "text-align": "right" }}>{props.children}</b>
    </div>
  )
}

function Code(props: { children: string }) {
  return (
    <code
      style={{
        background: "#f3f0e7",
        padding: "0 5px",
        "border-radius": "4px",
        "font-size": "10.5px",
      }}
    >
      {props.children}
    </code>
  )
}

export default Plugin.define({
  setup(ctx) {
    const ui = ctx.ui
    const [snap, setSnap] = createSignal<SyncSnapshot | null>(null)
    const [verifying, setVerifying] = createSignal(false)

    const refresh = async (remote: boolean): Promise<SyncSnapshot | null> => {
      if (remote) setVerifying(true)
      try {
        // ctx.client va letto al momento della chiamata (cambia dopo un restart).
        const raw = await ctx.client.rpc(MindSyncStatus).status(remote ? { remote: true } : {})
        const s = narrowSnapshot(raw)
        setSnap(s)
        return s
      } catch {
        return snap()
      } finally {
        if (remote) setVerifying(false)
      }
    }

    const openDiff = (s: SyncSnapshot | null) => {
      ctx.dialogs.open((dialog) => (
        <ui.Dialog
          title="Proposte in attesa"
          description="Sola lettura: nessun file .new viene adottato da solo."
          footer={
            <span style={{ display: "flex", gap: "8px", "justify-content": "flex-end" }}>
              <ui.Button variant="neutral" onClick={() => dialog.close()}>
                Chiudi
              </ui.Button>
            </span>
          }
        >
          <Show
            when={s !== null && s.proposals.length > 0}
            fallback={<p style={{ color: MUTED, "font-size": "11px" }}>Nessuna proposta in attesa.</p>}
          >
            <div style={{ padding: "2px 0 6px" }}>
              <For each={s?.proposals ?? []}>
                {(name) => (
                  <div style={{ padding: "5px 0", "border-bottom": `1px dotted ${LINE}` }}>
                    <Code>{name}</Code>
                  </div>
                )}
              </For>
              <p style={{ color: MUTED, "font-size": "10.5px" }}>
                Confronta a mano in `config/opencode.jsonc`: adozione solo per riconciliazione esplicita.
              </p>
            </div>
          </Show>
        </ui.Dialog>
      ))
    }

    const doSync = async (closeStatus: () => void) => {
      const ok = await ctx.dialogs.confirm({
        title: "Sincronizzare l'orchestratore?",
        description:
          "Esegue pull del repo mind-system e aggiorna i file locali. I file .new restano da approvare a mano.",
        confirm: "Sincronizza",
      })
      if (!ok) return
      const working = ctx.toast.show({ variant: "loading", title: "Sincronizzazione in corso…", persistent: true })
      try {
        const r = narrowResult(await ctx.client.rpc(MindSyncStatus).sync({}))
        working.dismiss()
        closeStatus()
        ctx.toast.show({
          variant: "success",
          title: "Orchestratore aggiornato.",
          description: `${shortHash(r.commit)} installato il ${r.date} · backup ${r.backup}`,
        })
        await refresh(false)
      } catch (err) {
        working.dismiss()
        ctx.toast.show({ variant: "error", title: "Sincronizzazione fallita.", description: fmtErr(err) })
      }
    }

    const openStatus = async () => {
      setVerifying(true)
      let error: string | null = null
      let s: SyncSnapshot | null = null
      try {
        const raw = await ctx.client.rpc(MindSyncStatus).status({ remote: true })
        s = narrowSnapshot(raw)
        setSnap(s)
      } catch (err) {
        error = fmtErr(err)
        s = snap()
      } finally {
        setVerifying(false)
      }
      const current = s
      const failure = error
      ctx.dialogs.open((dialog) => (
        <ui.Dialog
          title="Aggiornamento orchestratore"
          footer={
            <span style={{ display: "flex", gap: "8px", "justify-content": "flex-end" }}>
              <ui.Button variant="neutral" onClick={() => dialog.close()}>
                Dopo
              </ui.Button>
              <ui.Button variant="neutral" onClick={() => openDiff(current)}>
                Diff
              </ui.Button>
              <ui.Button variant="contrast" onClick={() => void doSync(dialog.close)}>
                Sincronizza
              </ui.Button>
            </span>
          }
        >
          <div style={{ padding: "2px 0 6px" }}>
            <Row label="Installato">
              <Show when={current !== null} fallback="sconosciuto">
                <Code>{shortHash(current?.installed ?? "?")}</Code> · {current?.installedOn ?? "?"}
              </Show>
            </Row>
            <Row label="Repo">
              <Show when={current !== null} fallback="sconosciuto">
                <Code>{shortHash(current?.head ?? "?")}</Code>
              </Show>
            </Row>
            <Row label="Proposte">
              <Show when={current !== null && current.proposals.length > 0} fallback="nessuna">
                <For each={current?.proposals ?? []}>{(name) => <Code>{name}</Code>}</For>
              </Show>
            </Row>
            <Row label="GitHub">
              <Show
                when={current !== null && current.behindOrigin !== null}
                fallback={failure ?? "non verificato"}
              >
                {(current?.behindOrigin ?? 0) === 0 ? "allineato" : `${current?.behindOrigin} commit da origin`}
              </Show>
            </Row>
          </div>
          <Show when={failure !== null}>
            <p style={{ color: "#9a6a14", "font-size": "10.5px" }}>{failure}</p>
          </Show>
        </ui.Dialog>
      ))
    }

    ctx.add(TitlebarItem, (): TitlebarItem => ({
      id: "mind-sync",
      label: pillLabel(snap(), verifying()),
      title: "Stato sync orchestratore",
      // "refresh" esiste nel catalogo AppIconName (@opencode/plugin 2.4.1);
      // niente icona custom: la pill resta testo + spinner (busy).
      icon: "refresh",
      busy: verifying(),
      run: () => void openStatus(),
    }))

    // Check locale all'apertura finestra: zero rete (stesso costo dell'avviso odierno).
    void refresh(false)
  },
})
