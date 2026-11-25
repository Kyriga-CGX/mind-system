import { Plugin, TitlebarItem } from "@opencode/plugin/gui"
import type { Rpc } from "@opencode/plugin/rpc"
import { createSignal, For, Show, type JSX } from "solid-js"
// Contratto reale di T1 (stesso pacchetto, `src/rpc.ts`). La GUI consuma
// solo questo shape:
//   status({ remote? }) → { installed, installedOn, head, proposals[], behindOrigin, checkedAt }
//   sync()              → { commit, at, backup } | { error } (stub fino a T4)
import { syncStatusDefinition } from "./rpc.js"

// Gli schema sono JSON Schema letterali (esempio ufficiale
// https://opencode.ai/docs/build/plugins/rpc); l'asserzione colma solo il
// branding nominale di effect, a runtime l'oggetto è identico. I metodi
// restano `unknown` in TS e vengono ristretti da narrowSnapshot/narrowResult.
const MindSyncStatus = syncStatusDefinition as unknown as Rpc.PortableDefinition

export interface SyncSnapshot {
  installed: string | null
  installedOn: string | null
  head: string | null
  proposals: string[]
  behindOrigin: boolean
  githubAhead: boolean
  checkedAt: string
}

export interface SyncResult {
  commit: string
  at: string
  backup: string
}

/** sync() è stub fino a T4: il server risponde `{ error }` invece del risultato. */
export class SyncPending extends Error {}

/** Restringe la risposta JSON Schema (`unknown` in TS) allo shape di T1. */
export function narrowSnapshot(raw: unknown): SyncSnapshot {
  const o = raw as Record<string, unknown>
  if (typeof o !== "object" || o === null) {
    throw new Error("risposta status() non valida")
  }
  const proposals = Array.isArray(o.proposals)
    ? o.proposals.filter((p): p is string => typeof p === "string")
    : []
  return {
    installed: typeof o.installed === "string" ? o.installed : null,
    installedOn: typeof o.installedOn === "string" ? o.installedOn : null,
    head: typeof o.head === "string" ? o.head : null,
    proposals,
    behindOrigin: o.behindOrigin === true,
    githubAhead: o.githubAhead === true,
    checkedAt: typeof o.checkedAt === "string" ? o.checkedAt : "",
  }
}

export function narrowResult(raw: unknown): SyncResult {
  const o = raw as Record<string, unknown>
  if (typeof o !== "object" || o === null) {
    throw new Error("risposta sync() non valida")
  }
  if (typeof o.error === "string") throw new SyncPending(o.error)
  if (typeof o.commit !== "string" || typeof o.at !== "string" || typeof o.backup !== "string") {
    throw new Error("risposta sync() non valida")
  }
  return { commit: o.commit, at: o.at, backup: o.backup }
}

/** Matrice stati pill (spec § Testing): allineato → OK, tutto il resto → UPDATE. */
export function needsUpdate(s: SyncSnapshot): boolean {
  if (s.installed === null || s.installed !== s.head) return true
  if (s.proposals.length > 0) return true
  if (s.githubAhead) return true
  return s.behindOrigin
}

export function pillLabel(s: SyncSnapshot | null, verifying: boolean): string {
  if (verifying || s === null) return "MIND · …"
  return needsUpdate(s) ? "MIND · UPDATE" : "MIND · OK"
}

export function shortHash(full: string): string {
  return full.slice(0, 7)
}

export function fmtErr(err: unknown): string {
  if (err instanceof SyncPending) return "non ancora implementato"
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

const PUNTA1 =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><g><animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="6s" repeatCount="indefinite"/><path d="M8 2 A6 6 0 0 1 14 8" stroke="#2e7d46" stroke-width="1.8" stroke-linecap="round"/></g></svg>'
const PUNTA2 =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><g><animate attributeName="opacity" values="1;.55;1" dur="1.6s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="2.4s" repeatCount="indefinite"/><path d="M8 2 A6 6 0 0 1 14 8" stroke="#9a6a14" stroke-width="1.8" stroke-linecap="round"/><path d="M8 14 A6 6 0 0 1 2 8" stroke="#9a6a14" stroke-width="1.8" stroke-linecap="round"/></g></svg>'

export default Plugin.define({
  icons: { punta1: PUNTA1, punta2: PUNTA2 },
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
          description: `${shortHash(r.commit)} installato il ${r.at} · backup ${r.backup}`,
        })
        await refresh(false)
      } catch (err) {
        working.dismiss()
        if (err instanceof SyncPending) {
          ctx.toast.show({ variant: "default", title: "Sincronizzazione non ancora disponibile.", description: err.message })
        } else {
          ctx.toast.show({ variant: "error", title: "Sincronizzazione fallita.", description: fmtErr(err) })
        }
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
              <Show when={current !== null} fallback={failure ?? "non verificato"}>
                {current?.behindOrigin === true
                  ? "dietro origin"
                  : current?.githubAhead === true
                    ? "GitHub avanti (sonda)"
                    : "allineato"}
              </Show>
            </Row>
          </div>
          <Show when={failure !== null}>
            <p style={{ color: "#9a6a14", "font-size": "10.5px" }}>{failure}</p>
          </Show>
        </ui.Dialog>
      ))
    }

    const upd = snap() !== null && needsUpdate(snap() as SyncSnapshot)
    ctx.add(TitlebarItem, (): TitlebarItem => ({
      id: "mind-sync",
      label: pillLabel(snap(), verifying()),
      title: "Stato sync orchestratore",
      // Due Punte (da Time Machine, scelta utente 2026-11-25): un arco = ok,
      // due archi = da aggiornare. Icona custom dichiarata sopra.
      icon: upd ? ctx.icons.punta2 : ctx.icons.punta1,
      busy: verifying(),
      run: () => void openStatus(),
    }))

    // Check locale all'apertura finestra: zero rete (stesso costo dell'avviso odierno).
    void refresh(false)

    // Timer silenziosi (mai busy, mai dialog): re-check locale ogni 5 min
    // (nuovi commit dopo l'apertura) + sonda GitHub ogni 15 min
    // (ls-remote, niente fetch — approvata dall'utente). Cleanup al dispose.
    const quiet = async (probe: boolean) => {
      try {
        const raw = await ctx.client.rpc(MindSyncStatus).status(probe ? { probe: true } : {})
        setSnap(narrowSnapshot(raw))
      } catch {
        // resta l'ultimo stato noto, mai un errore a video da solo
      }
    }
    const localTimer = setInterval(() => void quiet(false), 5 * 60 * 1000)
    const probeTimer = setInterval(() => void quiet(true), 15 * 60 * 1000)
    return () => {
      clearInterval(localTimer)
      clearInterval(probeTimer)
    }
  },
})
