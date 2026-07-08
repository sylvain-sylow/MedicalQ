// types/ovhcloud-node-ovh.d.ts
// Déclaration de type minimale pour @ovhcloud/node-ovh
// (le paquet n'inclut pas de types TypeScript)

declare module "@ovhcloud/node-ovh" {
  interface OvhOptions {
    endpoint?: string;
    appKey?: string;
    appSecret?: string;
    consumerKey?: string;
    clientID?: string;
    clientSecret?: string;
    timeout?: number;
  }

  interface OvhClient {
    request(
      method: string,
      path: string,
      params?: Record<string, unknown>,
      callback?: (err: unknown, result: unknown) => void
    ): void;

    requestPromised(
      method: string,
      path: string,
      params?: Record<string, unknown>
    ): Promise<unknown>;
  }

  function ovh(options: OvhOptions): OvhClient;

  export = ovh;
}
