// src/types/index.ts

// ==========================================
// ENTIDADES (Reflejan las @Document de Java)
// ==========================================

export interface PlantDevice {
  id: string;
  ownerId: string;
  plantId: string;
  name: string;
  description?: string;
  macAddress?: string;
  
  // Umbrales
  minHumidity?: number;
  maxHumidity?: number;
  minSoilHumidity?: number;
  maxSoilHumidity?: number;
  minTempC?: number;
  maxTempC?: number;
  minLightLux?: number;
  maxLightLux?: number;

  // Estado
  topic?: string;
  isActive: boolean;
  lastDataReceived?: string;
  qosLevel?: number;
}

export interface AppUser {
  id: string;
  username: string;
  email: string;
  plantsIds?: string[];
}

// ==========================================
// DTOs DE RESPUESTA (Reflejan los Records de Java)
// ==========================================

export interface KpiDto {
  currentTemp: number;
  currentSoil: number;
  currentLight: number;
  // Opcional porque Java no lo envía aún, pero lo calculamos en el front
  currentAmbient?: number; 
  healthIndex: number;
  dataQuality: number;
  lastUpdate: string;
}

export interface ChartPointDto {
  time: string;
  value: number;
}

export interface ClusterResultDto {
  period: string;
  clusters: Record<string, number>;
}

// ==========================================
// TIPOS DE UI (Para las gráficas del Frontend)
// ==========================================

export interface CombinedHistoryData {
  time: string;
  temp?: number;
  ambientHum?: number;
  soilHum?: number;
  light?: number;
  // 🔥 FIX: Index signature requerido por Recharts (LineChart)
  [key: string]: unknown; 
}

export interface ClusteringPiePoint {
  name: string;
  value: number;
  color: string;
  // 🔥 FIX: Index signature requerido por Recharts (PieChart)
  [key: string]: unknown;
}

// ==========================================
// COMANDOS Y AUTH
// ==========================================

export enum DeviceCommand {
  RIEGO = "RIEGO",
  CONFIG_SET = "CONFIG_SET",
  REBOOT = "REBOOT",
  CONFIG_RESET = "CONFIG_RESET",
  FORCE_READ = "FORCE_READ",
  SET_LIGHT_COLOR = "SET_LIGHT_COLOR"
}

export interface GenericCommandPayload {
  command: DeviceCommand;
  parameters?: Record<string, unknown>;
}

export interface AuthRequest {
  username: string;
  password: string;
  email?: string;
}