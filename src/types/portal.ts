export type InstructionPack = {
  id: string;
  name: string;
  description: string;
  instructions: string;
};

export type ConnectorConsentState = "not_requested" | "granted" | "denied";

export type ConnectorSyncOrigin = "synced" | "manual";
