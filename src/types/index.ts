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

// 🔥 NUEVA: Entidad Reading para reflejar Java
export interface Reading {
  id?: string;
  plantId: string;
  userId?: string;
  timestamp?: string;
  
  // Datos de sensores
  tempC?: number;
  ambientHumidity?: number;
  lightLux?: number;
  soilHumidity?: number;
  
  // Estado de bomba como boolean
  pumpOn?: boolean;
  
  // Enums
  msgType?: MessageType;
  qcStatus?: QcStatus;
  advisorResult?: AdvisorResult;
}

// ==========================================
// ENUMS (Reflejan los enums de Java)
// ==========================================

export enum QcStatus {
  VALID = "VALID",
  OUT_OF_RANGE = "OUT_OF_RANGE",
  RATE_ERROR = "RATE_ERROR", 
  QC_ERROR = "QC_ERROR",
  EVENT = "EVENT"
}

export enum AdvisorResult {
  CRITICA = "CRITICA",
  ALERTA = "ALERTA",
  RECOMENDACION = "RECOMENDACION",
  INFO = "INFO"
}

export enum MessageType {
  READING = "READING",
  EVENT = "EVENT"
}

export enum PumpState {
  ON = "ON",
  OFF = "OFF"
}

// ==========================================
// DTOs DE RESPUESTA (Reflejan los Records de Java)
// ==========================================

export interface KpiDto {
  currentTemp: number
  currentSoil: number
  currentLight: number
  healthIndex: number
  dataQuality: number
  lastUpdate: string
  pumpOn: boolean // 🔥 Cambiado a boolean
}

// types.ts
export interface PlantAlert {
    id: string;
    plantId: string;
    severity: "CRITICA" | "ALERTA" | "INFO";
    message: string;
    metric: string;
    value: number;
    timestamp: string; // ISO String
    isRead: boolean;
}

export interface ChartPointDto {
  time: string;
  value: number;
}

export interface ClusterResultDto {
  period: string;
  clusters: Record<string, number>;
}

// 🔥 NUEVO: Para respuestas de creación/actualización
export interface DeviceResponse {
  id: string;
  plantId: string;
  name: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}





// ==========================================
// WEBSOCKET TYPES - ACTUALIZADAS
// ==========================================

export enum WebSocketMessageType {
  TELEMETRY = "TELEMETRY",
  PUMP_EVENT = "PUMP_EVENT", 
  ALERT = "ALERT"
}

export interface WebSocketMessage<T = WebSocketData> {
  type: string;  // Cambiado de WebSocketMessageType a string para coincidir con Java
  plantId: string;
  timestamp: string;
  data: T;
}

// 🔥 ACTUALIZADO: Para coincidir con TelemetryData.java
export interface TelemetryData {
  temp?: number;
  ambientHum?: number;
  soilHum?: number;
  light?: number;
  pumpOn?: boolean;
  alertLevel?: string;
}

// 🔥 ACTUALIZADO: Para coincidir con PumpEvent.java
export interface PumpEventData {
  pumpOn: boolean;
  event: string;
}

// 🔥 ACTUALIZADO: Para coincidir con Alert.java
export interface AlertData {
  level: string;
  message: string;
  metric: string;
}

export type WebSocketData = TelemetryData | PumpEventData | AlertData;

// ==========================================
// DTOs DE RESPUESTA - ACTUALIZADOS
// ==========================================

export interface KpiDto {
  currentTemp: number;
  currentSoil: number;
  currentLight: number;
  healthIndex: number;
  dataQuality: number;
  lastUpdate: string;
  pumpOn: boolean;
}

export interface ChartPointDto {
  time: string;
  value: number;
}

export interface ClusterResultDto {
  period: string;
  clusters: Record<string, number>;
}

// 🔥 ACTUALIZADO: Para respuestas de creación/actualización
export interface DeviceResponse {
  id: string;
  plantId: string;
  name: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

// ==========================================
// TIPOS DE UI - ACTUALIZADOS
// ==========================================

export interface CombinedHistoryData {
  time: string;
  temp?: number;
  ambientHum?: number;
  soilHum?: number;
  light?: number;
  [key: string]: unknown; 
}

export interface ClusteringPiePoint {
  name: string;
  value: number;
  color: string;
  [key: string]: unknown;
}

// ==========================================
// COMANDOS Y AUTH - MANTENIDOS
// ==========================================

export enum DeviceCommand {
  RIEGO = "RIEGO",
  REBOOT = "REBOOT",
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

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  token?: string;
  message?: string;
}

// ==========================================
// CONFIGURACIÓN Y FORMULARIOS - MANTENIDOS
// ==========================================

export interface DeviceConfig {
  minSoilHumidity: number;
  maxSoilHumidity: number;
  minHumidity: number;
  maxHumidity: number;
  minTempC: number;
  maxTempC: number;
  minLightLux: number;
  maxLightLux: number;
}

export interface CreateDeviceRequest {
  plantId: string;
  name: string;
  ownerId: string;
  description?: string;
}

export interface UpdateDeviceRequest {
  name?: string;
  description?: string;
  minSoilHumidity?: number;
  maxSoilHumidity?: number;
  minTempC?: number;
  maxTempC?: number;
  minLightLux?: number;
  maxLightLux?: number;
}

// ==========================================
// TIPOS DE UTILIDAD - MANTENIDOS
// ==========================================

export type TimePeriod = "24h" | "7d" | "30d";
export type AlertLevel = "CRITICA" | "ALERTA" | "INFO";
export type SensorType = "temperature" | "humidity" | "light" | "soil_moisture";
export type WebSocketStatus = "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "ERROR";

// ==========================================
// CONSTANTES Y DEFAULTS - MANTENIDOS
// ==========================================

export const DEFAULT_CONFIG: DeviceConfig = {
  minSoilHumidity: 35,
  maxSoilHumidity: 90,
  minTempC: -5,
  maxTempC: 38,
  minLightLux: 200,
  maxLightLux: 50000,
  minHumidity: 40,
  maxHumidity: 80
};

export const SENSOR_RANGES = {
  temperature: { min: -20, max: 80 },
  humidity: { min: 0, max: 100 },
  light: { min: 0, max: 100000 },
  soil_moisture: { min: 0, max: 100 }
} as const;

// ==========================================
// HELPER TYPES - MANTENIDOS
// ==========================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Nullable<T> = T | null;

// ==========================================
// TIPOS PARA ESTADO GLOBAL - MANTENIDOS
// ==========================================

export interface AppState {
  user: AppUser | null;
  devices: PlantDevice[];
  selectedDevice: PlantDevice | null;
  isLoading: boolean;
  websocketStatus: WebSocketStatus;
}

export interface WebSocketState {
  isConnected: boolean;
  retryCount: number;
  lastMessage: WebSocketMessage | null;
  subscriptions: string[];
}