// Parte server del plugin `mind-sync-status`: espone via RPC lo stato di
// allineamento repo <-> installato ( riuso di plugins/mind-update.js,
// mai modificato) e lo stub di sync() (implementazione in T4).
// Barra: mai sync alla cieca — sync() parte solo dalla dialog, su conferma.
import { Plugin } from '@opencode/plugin';
import { syncStatusDefinition } from './rpc.ts';
import { getStatus, runSync } from './status.ts';

export const plugin = Plugin.define({
  id: 'mind-sync-status',
  setup: async (ctx) => {
    await ctx.rpc.register(syncStatusDefinition, {
      // Check locale (zero rete) di default; fetch solo con remote:true,
      // sonda ls-remote solo con probe:true.
      status: async (input) => getStatus(input ?? {}),
      // sync() reale (T5a): pull --ff-only + sync.ps1, solo su conferma dalla dialog.
      sync: async () => runSync(),
    });
  },
});

export default plugin;
