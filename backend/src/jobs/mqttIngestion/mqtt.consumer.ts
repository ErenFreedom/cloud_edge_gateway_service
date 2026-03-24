import mqtt, { MqttClient, ISubscriptionGrant } from "mqtt";
import dotenv from "dotenv";
import { processMessage } from "./mqtt.processor";
import { addToBuffer } from "./mqtt.buffer";

dotenv.config();

const client: MqttClient = mqtt.connect({
    host: process.env.MQTT_HOST,
    port: Number(process.env.MQTT_PORT),
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
});

client.on("connect", () => {
    console.log("MQTT Connected");
    client.subscribe("#", (err: Error | null, granted?: ISubscriptionGrant[]) => {
        if (err) {
            console.error("Subscription error:", err.message);
            return;
        }

        console.log("Subscribed:", granted);
    });
});

client.on("message", (topic: string, message: Buffer) => {
    try {
        const parsed: unknown = JSON.parse(message.toString());

        const processed = processMessage(topic, parsed);

        if (processed) {
            addToBuffer(processed);
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error("MQTT message error:", err.message);
        } else {
            console.error("MQTT message error:", err);
        }
    }
});