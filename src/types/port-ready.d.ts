declare module 'port-ready' {
  interface PortReadyOptions {
    host?: string;
    port: number;
    timeout?: number;
  }

  function portReady(port: number): Promise<number>;
  function portReady(options: PortReadyOptions): Promise<number>;

  export = portReady;
}
