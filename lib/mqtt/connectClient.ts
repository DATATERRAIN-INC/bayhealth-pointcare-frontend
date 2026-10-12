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

type MqttConnect = (url: string, options: MqttConnectOptions) => MqttClientHandle;

function resolveConnect(mod: Record<string, unknown>): MqttConnect | null {
  if (typeof mod.connect === "function") return mod.connect as MqttConnect;
  const defaults = mod.default;
  if (defaults && typeof defaults === "object") {
    const nested = defaults as Record<string, unknown>;
    if (typeof nested.connect === "function") {
      return (nested.connect as MqttConnect).bind(defaults);
    }
  }
  if (typeof defaults === "function") return defaults as MqttConnect;
  return null;
}

/** Dynamic MQTT connect for the browser client bundle. */
export async function connectMqttClient(
  url: string,
  options: MqttConnectOptions,
): Promise<MqttClientHandle> {
  const mod = (await import("mqtt")) as Record<string, unknown>;
  const connect = resolveConnect(mod);
  if (!connect) {
    throw new Error("mqtt.connect is not available");
  }
  return connect(url, options);
}
