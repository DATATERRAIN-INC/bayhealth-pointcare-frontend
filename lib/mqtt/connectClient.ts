import type { IClientOptions, MqttClient } from "mqtt";

export type MqttConnectOptions = {
  clientId: string;
  username: string;
  password: string;
  clean: boolean;
  reconnectPeriod: number;
  connectTimeout: number;
  protocolVersion: 4;
};

export type MqttClientHandle = {
  on(event: "connect" | "close" | "offline", listener: () => void): void;
  on(event: "message", listener: (topic: string, payload: Uint8Array | string) => void): void;
  on(event: "error", listener: (error: Error) => void): void;
  subscribe(
    topic: string,
    opts: { qos: 0 | 1 | 2 },
    callback?: (error: Error | null) => void,
  ): void;
  end(force?: boolean): void;
};

type MqttModule = {
  connect?: (brokerUrl: string, options?: IClientOptions) => MqttClient;
  default?: {
    connect?: (brokerUrl: string, options?: IClientOptions) => MqttClient;
  };
};

/**
 * Dynamic import keeps mqtt out of the initial client chunk.
 * Do not add a Turbopack resolveAlias for `mqtt` — the package `exports.browser`
 * already maps to `dist/mqtt.esm.js`. Aliasing to that path breaks AWS builds.
 */
export async function connectMqttClient(
  url: string,
  options: MqttConnectOptions,
): Promise<MqttClientHandle> {
  const mqttMod = (await import("mqtt")) as MqttModule;
  const connect =
    mqttMod.connect ??
    (mqttMod.default && typeof mqttMod.default.connect === "function"
      ? mqttMod.default.connect.bind(mqttMod.default)
      : null);

  if (typeof connect !== "function") {
    throw new Error("mqtt.connect is not available");
  }

  return connect(url, options) as MqttClientHandle;
}
