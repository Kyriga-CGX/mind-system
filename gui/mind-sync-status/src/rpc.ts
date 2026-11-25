// Contratto RPC portabile del plugin `mind-sync-status` (./rpc).
// Solo dati + tipi: nessuna importazione runtime, importabile ovunque
// (server, GUI, test). Le JSON Schema restano portabili per rpc.register.
export interface StatusInput {
  remote?: boolean;
}

export interface SyncStatus {
  installed: string | null;
  installedOn: string | null;
  head: string | null;
  proposals: string[];
  behindOrigin: boolean;
  checkedAt: string;
}

export interface SyncResult {
  commit: string;
  at: string;
  backup: string;
}

export interface SyncNotImplemented {
  error: string;
}

const statusInputSchema = {
  type: 'object',
  properties: { remote: { type: 'boolean' } },
  additionalProperties: false,
} as const;

const statusOutputSchema = {
  type: 'object',
  properties: {
    installed: { type: ['string', 'null'] },
    installedOn: { type: ['string', 'null'] },
    head: { type: ['string', 'null'] },
    proposals: { type: 'array', items: { type: 'string' } },
    behindOrigin: { type: 'boolean' },
    checkedAt: { type: 'string' },
  },
  required: ['installed', 'installedOn', 'head', 'proposals', 'behindOrigin', 'checkedAt'],
  additionalProperties: false,
} as const;

const syncInputSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const;

const syncOutputSchema = {
  type: 'object',
  properties: {
    commit: { type: 'string' },
    at: { type: 'string' },
    backup: { type: 'string' },
    // Stub di T1: finche' sync() non e' implementato (T4) risponde cosi'.
    error: { type: 'string' },
  },
  additionalProperties: false,
} as const;

export const syncStatusDefinition = {
  id: 'mind-sync-status',
  methods: {
    status: { input: statusInputSchema, output: statusOutputSchema },
    sync: { input: syncInputSchema, output: syncOutputSchema },
  },
  events: {},
} as const;
