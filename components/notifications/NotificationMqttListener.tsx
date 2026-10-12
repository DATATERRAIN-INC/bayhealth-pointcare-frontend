"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useStore } from "react-redux";
import { useGetNotificationTopicsQuery } from "@/lib/api/notificationsApi";
import { getMqttBrokerUrl, getMqttPassword, getMqttUsername } from "@/lib/mqtt/brokerUrl";
import { connectMqttClient, type MqttClientHandle } from "@/lib/mqtt/connectClient";
import { handleMqttMessage } from "@/lib/mqtt/handleMqttMessage";
import type { AppDispatch, RootState } from "@/lib/store";

/**
 * After login: GET get-topics → subscribe to every topic → apply live MQTT JSON.
 * HTTP APIs are unchanged; this only patches RTK cache / refetches call lists.
 */
export function NotificationMqttListener() {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const { data: topics, isLoading, isError, error, isUninitialized } = useGetNotificationTopicsQuery();
  const clientRef = useRef<MqttClientHandle | null>(null);

  useEffect(() => {
    const connectionUrl = getMqttBrokerUrl();
    const username = getMqttUsername();
    const password = getMqttPassword();
    const allTopics = [...new Set((topics ?? []).map((topic) => topic.trim()).filter(Boolean))];

    if (isUninitialized || isLoading || topics === undefined) {
      if (isError) {
        console.warn("[mqtt] get-topics failed — cannot subscribe", error);
      } else {
        console.log("[mqtt] waiting for get-topics…");
      }
      return;
    }

    if (isError && allTopics.length === 0) {
      console.warn("[mqtt] get-topics failed — cannot subscribe", error);
      return;
    }

    if (!connectionUrl || !username || !password) {
      console.warn("[mqtt] missing env — set NEXT_PUBLIC_MQTT_URL / USERNAME / PASSWORD", {
        hasUrl: Boolean(connectionUrl),
        hasUsername: Boolean(username),
        hasPassword: Boolean(password),
      });
      return;
    }

    if (allTopics.length === 0) {
      console.warn("[mqtt] no topics from get-topics", { topics });
      return;
    }

    let cancelled = false;

    async function connect() {
      if (cancelled) return;

      try {
        clientRef.current?.end(true);
        clientRef.current = null;

        console.log("[mqtt] connecting…", connectionUrl, "topics:", allTopics);

        const client = await connectMqttClient(connectionUrl, {
          clientId: `bach_web_${Math.random().toString(16).slice(2, 10)}`,
          username,
          password,
          clean: true,
          reconnectPeriod: 4000,
          connectTimeout: 15000,
          protocolVersion: 4,
        });
        if (cancelled) {
          client.end(true);
          return;
        }
        clientRef.current = client;

        client.on("connect", () => {
          if (cancelled) return;
          console.log("[mqtt] connected", connectionUrl);
          allTopics.forEach((topic) => {
            client.subscribe(topic, { qos: 1 }, (err: Error | null) => {
              if (err) {
                console.warn("[mqtt] subscribe failed", topic, err.message);
                return;
              }
              console.log("[mqtt] subscribed", topic);
            });
          });
        });

        client.on("message", (topic: string, payload: Uint8Array | string) => {
          if (cancelled) return;
          const raw =
            typeof payload === "string" ? payload : new TextDecoder().decode(payload);
          console.log("[mqtt] message", topic, raw.slice(0, 240));
          handleMqttMessage(dispatch, store.getState, raw);
        });

        client.on("close", () => {
          console.log("[mqtt] disconnected");
        });

        client.on("offline", () => {
          console.warn("[mqtt] offline");
        });

        client.on("error", (err: Error) => {
          console.warn("[mqtt] connection error:", err.message);
        });
      } catch (err) {
        console.warn("[mqtt] failed to start", err);
      }
    }

    void connect();

    return () => {
      cancelled = true;
      clientRef.current?.end(true);
      clientRef.current = null;
    };
  }, [dispatch, store, topics, isLoading, isUninitialized, isError, error]);

  return null;
}
