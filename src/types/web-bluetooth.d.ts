/*
 * Path: C:/Users/HVC/WebstormProjects/elom-frontend/src/types/web-bluetooth.d.ts
 * File: web-bluetooth.d.ts
 * Project: elom-frontend
 *
 */

declare type BluetoothServiceUUID = number | string;

declare interface BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
}

declare interface BluetoothDevice {
    id?: string;
    name?: string;
}

declare interface BluetoothRemoteGATTServer {
    connected?: boolean;
}
