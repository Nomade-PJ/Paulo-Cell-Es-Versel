/**
 * Definições de tipo para a Web Bluetooth API
 * Esta definição permite que o TypeScript entenda as interfaces
 * relacionadas à Web Bluetooth API utilizadas no projeto.
 */

// Extendendo a interface Navigator para incluir a Bluetooth API
interface Navigator {
  bluetooth: Bluetooth;
}

// Definição da API Bluetooth
interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  getAvailability(): Promise<boolean>;
  getDevices(): Promise<BluetoothDevice[]>;
}

// Opções para requisição de dispositivo
interface RequestDeviceOptions {
  filters?: BluetoothRequestDeviceFilter[];
  optionalServices?: BluetoothServiceUUID[];
  acceptAllDevices?: boolean;
}

// Filtros para busca de dispositivos
interface BluetoothRequestDeviceFilter {
  services?: BluetoothServiceUUID[];
  name?: string;
  namePrefix?: string;
  manufacturerId?: number;
  serviceDataUUID?: BluetoothServiceUUID;
}

// Definição do dispositivo Bluetooth
interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  watchAdvertisements(): Promise<void>;
  unwatchAdvertisements(): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: EventListenerOptions): void;
}

// Servidor GATT Remoto (Generic Attribute Profile)
interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

// Serviço GATT
interface BluetoothRemoteGATTService extends EventTarget {
  device: BluetoothDevice;
  uuid: string;
  isPrimary: boolean;
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
  getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  getIncludedServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

// Característica GATT
interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  value?: DataView;
  getDescriptor(descriptor: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor>;
  getDescriptors(descriptor?: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor[]>;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

// Propriedades da característica
interface BluetoothCharacteristicProperties {
  broadcast: boolean;
  read: boolean;
  writeWithoutResponse: boolean;
  write: boolean;
  notify: boolean;
  indicate: boolean;
  authenticatedSignedWrites: boolean;
  reliableWrite: boolean;
  writableAuxiliaries: boolean;
}

// Descritor GATT
interface BluetoothRemoteGATTDescriptor {
  characteristic: BluetoothRemoteGATTCharacteristic;
  uuid: string;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
}

// Tipos de UUID
type BluetoothServiceUUID = string | number;
type BluetoothCharacteristicUUID = string | number;
type BluetoothDescriptorUUID = string | number; 