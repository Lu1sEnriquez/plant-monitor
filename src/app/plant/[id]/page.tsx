"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

// UI Imports (Componentes)
import { PlantHeader } from "@/components/plant-details/PlantHeader";
import { ControlPanel } from "@/components/plant-details/ControlPanel";
import { KpiGrid } from "@/components/plant-details/KpiGrid";
import { ChartsSection } from "@/components/plant-details/ChartsSection";
import { ActivityLog, LogEntry } from "@/components/plant-details/ActivityLog";
import { AlertHistory } from "@/components/plant-details/AlertHistory"; // <--- IMPORTAR NUEVO COMPONENTE
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // <--- IMPORTAR TABS

// Servicios y Tipos
import { apiService } from "@/services/apiService";
import {
  KpiDto, PlantDevice, DeviceCommand, CombinedHistoryData, ClusteringPiePoint,
  WebSocketMessage, TelemetryData, PumpEventData, AlertData, DeviceConfig,
  DEFAULT_CONFIG, WebSocketData, PlantAlert // <--- IMPORTAR TIPO PlantAlert
} from "@/types";

// WebSocket
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export default function PlantDetailPage() {
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
  const [alertHistory, setAlertHistory] = useState<PlantAlert[]>([]); // <--- NUEVO ESTADO
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

  // ... (Hooks de Sesión y Cálculo de HealthIndex iguales) ...
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) router.push("/login");
    else setUser(storedUser);
  }, [router]);

  const calculateHealthIndex = useCallback((telemetry: TelemetryData): number => {
    // ... (Tu lógica existente) ...
    let score = 100;
    const soil = telemetry.soilHum ?? 50; 
    const temp = telemetry.temp ?? 25;
    if (soil < config.minSoilHumidity) score -= 40;
    else if (soil < config.minSoilHumidity + 10) score -= 20;
    if (temp > config.maxTempC) score -= 30;
    else if (temp > config.maxTempC - 5) score -= 15;
    return Math.max(0, score);
  }, [config]);

  // ... (Handlers de WebSocket iguales) ...
  const handleTelemetryData = useCallback((msg: WebSocketMessage<TelemetryData>) => {
    // ... (Tu lógica existente) ...
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
    
    // ... update history logic ...
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
      // ... (Tu lógica existente) ...
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
    
    // 🔥 IMPORTANTE: Recargar historial de alertas cuando llega una nueva por socket
    apiService.getAlerts(plantId).then(setAlertHistory); 
  }, [plantId]);

  const handleWebSocketMessage = useCallback((data: WebSocketMessage<WebSocketData>) => {
      setLastUpdated(new Date().toLocaleTimeString());
      switch (data.type) {
        case "TELEMETRY": handleTelemetryData(data as WebSocketMessage<TelemetryData>); break;
        case "PUMP_EVENT": handlePumpEvent(data as WebSocketMessage<PumpEventData>); break;
        case "ALERT": handleAlertData(data as WebSocketMessage<AlertData>); break;
        default: console.warn("Unknown message:", data.type);
      }
  }, [handleTelemetryData, handlePumpEvent, handleAlertData]);

  // ... (WebSocket Connection Effect igual) ...
  useEffect(() => {
    if (!plantId || !user) return;
    let isSubscribed = false;
    const connectWebSocket = () => {
        // ... (Tu código de conexión) ...
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

  // --- CARGA DE DATOS ---
  const loadData = useCallback(async () => {
    if (!user || !plantId) return;
    try {
      // 1. Devices & Config
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

      // 2. Data
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
            // ... (mapeo clusters) ...
            const chartClusters = Object.entries(clusters.clusters).map(([key, value]) => ({
                name: key,
                value: value,
                color: key.includes("SECO") ? "#ef4444" : key.includes("OPTIMO") ? "#10b981" : "#3b82f6",
            }));
            setClusteringData(chartClusters);
        } catch { setClusteringData([]); }
      }

      // 3. 🔥 NUEVO: Cargar Historial de Alertas
      try {
        const alerts = await apiService.getAlerts(plantId);
        setAlertHistory(alerts);
      } catch (e) { console.error("Error alerts", e); }

    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }, [user, plantId, timePeriod, deviceInfo, isWebSocketConnected, kpiData]);

  // ... (Polling Effect y Handlers de Usuario iguales) ...
  useEffect(() => {
      if (!isWebSocketConnected) {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
      }
    }, [loadData, isWebSocketConnected]);

  const handleWatering = async () => {
    // ...
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
    // ...
    if (!plantId) return;
    try {
      await apiService.updateConfig(plantId, config);
      toast.success("✅ Configuración Guardada");
      setIsConfigOpen(false);
      loadData();
    } catch { toast.error("❌ Error al guardar"); }
  };

  if (!user) return null;
  if (isLoading && !kpiData) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-muted-foreground">Cargando datos de {plantId}...</p>
      </div>
    </div>
  );

  const safeKpi = kpiData || { currentTemp: 0, currentSoil: 0, healthIndex: 0, dataQuality: 0, currentLight: 0, lastUpdate: "", pumpOn: false };
  const currentAmbientHum = historyData.length > 0 ? historyData[historyData.length - 1].ambientHum || 0 : 0;

  return (
    <div className="min-h-screen bg-background pb-10">
      <PlantHeader 
        deviceInfo={deviceInfo} plantId={plantId} isWebSocketConnected={isWebSocketConnected}
        webSocketRetries={webSocketRetries} lastUpdated={lastUpdated} config={config}
        setConfig={setConfig} onSaveConfig={handleSaveConfig} isConfigOpen={isConfigOpen}
        setIsConfigOpen={setIsConfigOpen}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <ControlPanel isWatering={isWatering} isWebSocketConnected={isWebSocketConnected} onWateringClick={handleWatering} />

        <KpiGrid kpi={safeKpi} config={config} currentAmbientHum={currentAmbientHum} />

        <ChartsSection 
          historyData={historyData} clusteringData={clusteringData} timePeriod={timePeriod}
          setTimePeriod={setTimePeriod} isWebSocketConnected={isWebSocketConnected}
        />

        {/* --- SECCIÓN DE LOGS Y ALERTAS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Columna Izquierda: Detalles Técnicos */}
            <div className="space-y-6">
                <Accordion type="single" collapsible className="bg-white rounded-lg border px-4 shadow-sm">
                    <AccordionItem value="item-1" className="border-none">
                        <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-3">
                        Ver Detalles Técnicos del Dispositivo
                        </AccordionTrigger>
                        <AccordionContent>
                        <div className="grid grid-cols-2 gap-4 pb-4 text-xs font-mono">
                            <div><span className="block text-gray-400">ID</span><span>{deviceInfo?.id || "N/A"}</span></div>
                            <div><span className="block text-gray-400">Topic</span><span>{deviceInfo?.topic || "N/A"}</span></div>
                            <div className="flex items-center gap-2 mt-2">
                            {deviceInfo?.isActive ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            <span>{deviceInfo?.isActive ? "Conectado" : "Desconectado"}</span>
                            </div>
                        </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
                {/* OPCIONAL: Puedes mover ActivityLog aquí si prefieres un diseño de 2 columnas */}
            </div>

            {/* Columna Derecha / Abajo: Tabs para Logs y Alertas */}
            <div className="md:col-span-2">
                <Tabs defaultValue="live" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="live">Bitácora en Vivo (WebSocket)</TabsTrigger>
                        <TabsTrigger value="history">Historial de Alertas (Cloud)</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="live">
                        <ActivityLog logs={liveLogs} isWebSocketConnected={isWebSocketConnected} />
                    </TabsContent>
                    
                    <TabsContent value="history">
                        {/* AQUI USAMOS EL NUEVO COMPONENTE */}
                        <AlertHistory alerts={alertHistory} isLoading={isLoading && !kpiData} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </main>
    </div>
  );
}