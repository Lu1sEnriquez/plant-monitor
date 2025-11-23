import { 
  PlantDevice, 
  KpiDto, 
  ChartPointDto, 
  ClusterResultDto, 
  GenericCommandPayload, 
  DeviceCommand,
  AuthRequest, 
  AppUser,
  CombinedHistoryData
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Función auxiliar para obtener las credenciales (Basic Auth)
const getAuthHeaders = (): Record<string, string> => {
  const user = localStorage.getItem("apiUser");
  const pass = localStorage.getItem("apiPass");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (user && pass) {
    const token = btoa(`${user}:${pass}`);
    headers["Authorization"] = `Basic ${token}`;
  }
  
  return headers;
};

export const apiService = {
  
  // --- AUTH ---
  login: async (credentials: AuthRequest): Promise<AppUser> => {
    const token = btoa(`${credentials.username}:${credentials.password}`);
    
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) throw new Error("Credenciales inválidas");
    return res.json(); 
  },

  register: async (data: AuthRequest): Promise<string> => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Error en el registro");
    }
    return res.text();
  },

  // --- DISPOSITIVOS ---
  getDevices: async (): Promise<PlantDevice[]> => {
    const res = await fetch(`${API_URL}/devices`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Error fetching devices");
    return res.json();
  },

  createDevice: async (plantId: string, name: string, userId: string) => {
    const res = await fetch(`${API_URL}/devices`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ plantId, name, userId }) 
    });
    
    if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(errorMsg || "Error creando dispositivo");
    }
    return res.json();
  },

  // --- ANALÍTICA ---
  getPlantKPIs: async (plantId: string): Promise<KpiDto> => {
    const res = await fetch(`${API_URL}/analytics/${plantId}/kpi`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Error fetching KPIs");
    return res.json();
  },

  getHistoryCombined: async (plantId: string, range: string = "24h"): Promise<CombinedHistoryData[]> => {
    const endpoints = [
        `field=temperatura&range=${range}`,
        `field=humedad_aire&range=${range}`,
        `field=humedad_suelo&range=${range}`,
        `field=luz&range=${range}`
    ];

    const promises = endpoints.map(qs => 
        fetch(`${API_URL}/analytics/${plantId}/history?${qs}`, { headers: getAuthHeaders() })
            .then(res => res.ok ? res.json() : [])
    );

    const [temps, hums, soils, lights] = await Promise.all(promises) as [ChartPointDto[], ChartPointDto[], ChartPointDto[], ChartPointDto[]];

    const mergedData = new Map<string, CombinedHistoryData>();

    const fillMap = (data: ChartPointDto[], key: keyof CombinedHistoryData) => {
        data.forEach(point => {
            const timeKey = new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (!mergedData.has(timeKey)) mergedData.set(timeKey, { time: timeKey });
            (mergedData.get(timeKey) as CombinedHistoryData)[key] = point.value;
        });
    };

    fillMap(temps, 'temp');
    fillMap(hums, 'ambientHum');
    fillMap(soils, 'soilHum');
    fillMap(lights, 'light');

    return Array.from(mergedData.values()).sort((a, b) => a.time.localeCompare(b.time)); 
  },
  
  getClustering: async (plantId: string, range: string = "7d"): Promise<ClusterResultDto> => {
    const res = await fetch(`${API_URL}/analytics/${plantId}/clustering?range=${range}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Error fetching clustering");
    return res.json();
  },

  // --- COMANDOS ---
  sendCommand: async (plantId: string, commandType: DeviceCommand) => {
    const payload: GenericCommandPayload = { command: commandType };
    const res = await fetch(`${API_URL}/devices/${plantId}/command`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Error sending command");
    return res.text();
  },
  
  updateConfig: async (plantId: string, config: Partial<PlantDevice>) => {
    const res = await fetch(`${API_URL}/devices/${plantId}/thresholds`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error("Error updating config");
    return res.json();
  }
};