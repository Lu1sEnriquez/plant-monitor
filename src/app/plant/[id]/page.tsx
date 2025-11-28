"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

// UI Imports (Componentes Refactorizados)
// AJUSTA LAS RUTAS SEGÚN DONDE LOS GUARDES
import { PlantHeader } from "@/components/plant-details/PlantHeader";
import { ControlPanel } from "@/components/plant-details/ControlPanel";
import { KpiGrid } from "@/components/plant-details/KpiGrid";
import { ChartsSection } from "@/components/plant-details/ChartsSection";
import { ActivityLog, LogEntry } from "@/components/plant-details/ActivityLog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Servicios
import { apiService } from "@/services/apiService";

// Tipos
import {
  KpiDto,
  PlantDevice,
  DeviceCommand,
  CombinedHistoryData,
  ClusteringPiePoint,
  WebSocketMessage,
  TelemetryData,
  PumpEventData,
  AlertData,
  DeviceConfig,
  DEFAULT_CONFIG,
  WebSocketData, 
} from "@/types";

// WebSocket
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export default function PlantDetailPage() {
  // 1. OBTENCIÓN ID
  const params = useParams();
  const plantId = params.id as string;
  const router = useRouter();

  // --- ESTADOS ---
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("Cargando...");
  const [timePeriod, setTimePeriod] = useState("24h");

  // Datos
  const [kpiData, setKpiData] = useState<KpiDto | null>(null);
  const [historyData, setHistoryData] = useState<CombinedHistoryData[]>([]);
  const [clusteringData, setClusteringData] = useState<ClusteringPiePoint[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<PlantDevice | null>(null);

  const [isWatering, setIsWatering] = useState(false);
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);

  // WebSocket States
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [webSocketRetries, setWebSocketRetries] = useState(0);

  // Configuración
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<DeviceConfig>(DEFAULT_CONFIG);

  // 2. Verificar Sesión
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) router.push("/login");
    else setUser(storedUser);
  }, [router]);

  // 3. LOGICA - Helpers
  const calculateHealthIndex = useCallback((telemetry: TelemetryData): number => {
    let score = 100;
    const soil = telemetry.soilHum ?? 50; 
    const temp = telemetry.temp ?? 25;

    if (soil < config.minSoilHumidity) {
      score -= 40;
    } else if (soil < config.minSoilHumidity + 10) {
      score -= 20;
    }

    if (temp > config.maxTempC) {
      score -= 30;
    } else if (temp > config.maxTempC - 5) {
      score -= 15;
    }

    return Math.max(0, score);
  }, [config]);

  // 4. LOGICA - Handlers de Datos (WebSocket & Polling)
  const handleTelemetryData = useCallback((msg: WebSocketMessage<TelemetryData>) => {
    const telemetry = msg.data;
    setKpiData(prev => ({
      ...prev!,
      currentTemp: telemetry.temp ?? prev?.currentTemp ?? 0,
      currentSoil: telemetry.soilHum ?? prev?.currentSoil ?? 0,
      currentLight: telemetry.light ?? prev?.currentLight ?? 0,
      pumpOn: telemetry.pumpOn ?? prev?.pumpOn ?? false, 
      healthIndex: calculateHealthIndex(telemetry),
      lastUpdate: new Date().toISOString(),
      dataQuality: prev?.dataQuality ?? 100
    }));

    const logMsg = `T:${telemetry.temp?.toFixed(1) ?? '--'}°C | H:${telemetry.ambientHum ?? '--'}% | S:${telemetry.soilHum ?? '--'}%`;
    setLiveLogs((prev) => [
      { time: new Date().toLocaleTimeString(), msg: logMsg, type: "DATA" },
      ...prev.slice(0, 49),
    ]);

    setHistoryData((prev) => {
      const newPoint: CombinedHistoryData = {
        time: new Date().toLocaleTimeString(),
        temp: telemetry.temp,
        ambientHum: telemetry.ambientHum,
        soilHum: telemetry.soilHum,
        light: telemetry.light,
      };
      return [...prev.slice(-99), newPoint];
    });
  }, [calculateHealthIndex]);

  const handlePumpEvent = useCallback((msg: WebSocketMessage<PumpEventData>) => {
    const pumpOn = msg.data.pumpOn; 
    setIsWatering(pumpOn);
    setKpiData(prev => prev ? ({ ...prev, pumpOn: pumpOn }) : null);

    if (pumpOn) toast.success("💧 Riego Iniciado");
    else toast.info("💧 Riego Finalizado");

    setLiveLogs((prev) => [
      { time: new Date().toLocaleTimeString(), msg: pumpOn ? "Bomba ENCENDIDA" : "Bomba APAGADA", type: "INFO" },
      ...prev,
    ]);
  }, []);

  const handleAlertData = useCallback((msg: WebSocketMessage<AlertData>) => {
    const { level, message } = msg.data;
    if (level === "CRITICA") toast.error("🚨 Alerta Crítica", { description: message });
    else if (level === "ALERTA") toast.warning("⚠️ Alerta", { description: message });

    setLiveLogs((prev) => [
      { time: new Date().toLocaleTimeString(), msg: `ALERTA: ${message}`, type: "ALERT" },
      ...prev,
    ]);
  }, []);

  const handleWebSocketMessage = useCallback((data: WebSocketMessage<WebSocketData>) => {
    setLastUpdated(new Date().toLocaleTimeString());
    switch (data.type) {
      case "TELEMETRY": handleTelemetryData(data as WebSocketMessage<TelemetryData>); break;
      case "PUMP_EVENT": handlePumpEvent(data as WebSocketMessage<PumpEventData>); break;
      case "ALERT": handleAlertData(data as WebSocketMessage<AlertData>); break;
      default: console.warn("Unknown message:", data.type);
    }
  }, [handleTelemetryData, handlePumpEvent, handleAlertData]);

  // 5. LOGICA - WebSocket Connection
  useEffect(() => {
    if (!plantId || !user) return;
    let isSubscribed = false;

    const connectWebSocket = () => {
      try {
        const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";
        const socket = new SockJS(socketUrl);
        const client = new Client({
          webSocketFactory: () => socket,
          reconnectDelay: 5000,
          onConnect: () => {
            console.log("✅ WebSocket conectado");
            setIsWebSocketConnected(true);
            setWebSocketRetries(0);
            isSubscribed = true;
            client.subscribe(`/topic/plant/${plantId}`, (message: IMessage) => {
              try {
                const data: WebSocketMessage<WebSocketData> = JSON.parse(message.body);
                handleWebSocketMessage(data);
              } catch (e) { console.error("Parse Error", e); }
            });
            toast.success("Conexión en tiempo real establecida");
          },
          onStompError: () => {
            setIsWebSocketConnected(false);
            setWebSocketRetries((prev) => prev + 1);
          },
          onDisconnect: () => setIsWebSocketConnected(false),
        });

        client.activate();
        setStompClient(client);
      } catch (e) { setIsWebSocketConnected(false); }
    };

    connectWebSocket();
    return () => { if (stompClient) stompClient.deactivate(); };
  }, [plantId, user, webSocketRetries, handleWebSocketMessage]);

  // 6. LOGICA - Carga de Datos Inicial / Polling
  const loadData = useCallback(async () => {
    if (!user || !plantId) return;
    try {
      if (!deviceInfo) {
        const devices = await apiService.getDevices();
        const myDevice = devices.find((d) => d.plantId === plantId);
        if (myDevice) {
          setDeviceInfo(myDevice);
          setConfig({
            minSoilHumidity: myDevice.minSoilHumidity ?? DEFAULT_CONFIG.minSoilHumidity,
            maxSoilHumidity: myDevice.maxSoilHumidity ?? DEFAULT_CONFIG.maxSoilHumidity,
            minTempC: myDevice.minTempC ?? DEFAULT_CONFIG.minTempC,
            maxTempC: myDevice.maxTempC ?? DEFAULT_CONFIG.maxTempC,
            minLightLux: myDevice.minLightLux ?? DEFAULT_CONFIG.minLightLux,
            maxLightLux: myDevice.maxLightLux ?? DEFAULT_CONFIG.maxLightLux,
          });
        }
      }

      if (!isWebSocketConnected || !kpiData) {
        const kpis = await apiService.getPlantKPIs(plantId);
        setKpiData(kpis);
        setLastUpdated(new Date().toLocaleTimeString());

        try {
          const history = await apiService.getHistoryCombined(plantId, timePeriod);
          setHistoryData(history);
        } catch { console.warn("No history"); }

        try {
          const clusters = await apiService.getClustering(plantId, "7d");
          const chartClusters = Object.entries(clusters.clusters).map(([key, value]) => ({
            name: key,
            value: value,
            color: key.includes("SECO") ? "#ef4444" : key.includes("OPTIMO") ? "#10b981" : "#3b82f6",
          }));
          setClusteringData(chartClusters);
        } catch { setClusteringData([]); }
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }, [user, plantId, timePeriod, deviceInfo, isWebSocketConnected, kpiData]);

  useEffect(() => {
    if (!isWebSocketConnected) {
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [loadData, isWebSocketConnected]);

  // 7. LOGICA - Acciones de Usuario
  const handleWatering = async () => {
    if (!plantId) return;
    setIsWatering(true);
    setLiveLogs((prev) => [{ time: new Date().toLocaleTimeString(), msg: "Enviando comando RIEGO...", type: "INFO" }, ...prev]);
    try {
      await apiService.sendCommand(plantId, DeviceCommand.RIEGO);
      toast.success("💧 Comando Enviado");
    } catch {
      toast.error("❌ Error al enviar comando");
      setIsWatering(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!plantId) return;
    try {
      await apiService.updateConfig(plantId, config);
      toast.success("✅ Configuración Guardada");
      setIsConfigOpen(false);
      loadData();
    } catch { toast.error("❌ Error al guardar"); }
  };

  // --- RENDERIZADO ---
  if (!user) return null;

  if (isLoading && !kpiData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-muted-foreground">Cargando datos de {plantId}...</p>
        </div>
      </div>
    );
  }

  // Datos seguros para hijos
  const safeKpi = kpiData || { currentTemp: 0, currentSoil: 0, healthIndex: 0, dataQuality: 0, currentLight: 0, lastUpdate: "", pumpOn: false };
  const currentAmbientHum = historyData.length > 0 ? historyData[historyData.length - 1].ambientHum || 0 : 0;

  return (
    <div className="min-h-screen bg-background pb-10">
      <PlantHeader 
        deviceInfo={deviceInfo}
        plantId={plantId}
        isWebSocketConnected={isWebSocketConnected}
        webSocketRetries={webSocketRetries}
        lastUpdated={lastUpdated}
        config={config}
        setConfig={setConfig}
        onSaveConfig={handleSaveConfig}
        isConfigOpen={isConfigOpen}
        setIsConfigOpen={setIsConfigOpen}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <ControlPanel 
          isWatering={isWatering} 
          isWebSocketConnected={isWebSocketConnected} 
          onWateringClick={handleWatering} 
        />

        <KpiGrid 
          kpi={safeKpi} 
          config={config} 
          currentAmbientHum={currentAmbientHum} 
        />

        <ChartsSection 
          historyData={historyData}
          clusteringData={clusteringData}
          timePeriod={timePeriod}
          setTimePeriod={setTimePeriod}
          isWebSocketConnected={isWebSocketConnected}
        />

        {/* Metadatos Técnicos (Dejado aquí simple o se puede extraer también) */}
        <Accordion type="single" collapsible className="bg-white rounded-lg border px-4">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-3">
              Ver Detalles Técnicos del Dispositivo
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 text-xs font-mono">
                <div><span className="block text-gray-400">Internal ID</span><span>{deviceInfo?.id || "N/A"}</span></div>
                <div><span className="block text-gray-400">MQTT Topic</span><span>{deviceInfo?.topic || "N/A"}</span></div>
                <div><span className="block text-gray-400">Owner</span><span>{deviceInfo?.ownerId || "N/A"}</span></div>
                <div className="flex items-center gap-2">
                  {deviceInfo?.isActive ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  <span>{deviceInfo?.isActive ? "Conectado" : "Desconectado"}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <ActivityLog logs={liveLogs} isWebSocketConnected={isWebSocketConnected} />
      </main>
    </div>
  );
}