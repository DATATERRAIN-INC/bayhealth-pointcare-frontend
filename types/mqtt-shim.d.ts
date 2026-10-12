declare module "mqtt" {
  const mqtt: {
    connect: (url: string, options?: Record<string, unknown>) => unknown;
    default?: {
      connect?: (url: string, options?: Record<string, unknown>) => unknown;
    };
  };
  export = mqtt;
}
