import type { AuthorizeRequest, AuthorizeResponse } from '@deriv/api-types';
import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';
import { Observable } from 'rxjs';
import { WebSocket } from 'ws';

import { getServerConfig } from '../utils/websocket';

import {
  TSocketEndpointNames,
  TSocketRequestProps,
  TSocketResponse,
  TSocketSubscribableEndpointNames,
} from './types';


export type TDerivApi = {
  send: (...requestData: unknown[]) => Promise<unknown>;
  subscribe: (...requestData: unknown[]) => object;
  authorize: (requestData: AuthorizeRequest) => Promise<AuthorizeResponse>;
};

const PING_INTERVAL = 20000;

const RECONNECTION_INTERVAL = 5000;

export class ApiManager {
  private socket!: WebSocket;

  private derivApi!: TDerivApi;

  private pingInterval!: NodeJS.Timer;

  private reconnectionInterval!: NodeJS.Timer;

  public static instance: ApiManager;

  public static getInstance() {
    if (!ApiManager.instance) {
      ApiManager.instance = new ApiManager();
    }
    return ApiManager.instance;
  }

  public init() {
    if (!this.socket) {
      const { serverUrl, appId } = getServerConfig();
      this.socket = new WebSocket(
        `wss://${serverUrl}/websockets/v3?app_id=${appId}`
      );
    }
    this.derivApi = new DerivAPIBasic({ connection: this.socket });
    this.registerKeepAlive();
  }

  public augmentedSend<T extends TSocketEndpointNames>(
    name: T,
    request?: TSocketRequestProps<T> extends never
      ? undefined
      : TSocketRequestProps<T>
  ): Promise<TSocketResponse<T>> {
    return this.derivApi.send({ [name]: 1, ...request }) as Promise<
      TSocketResponse<T>
    >;
  }

  public augmentedSubscribe<T extends TSocketSubscribableEndpointNames>(
    name: T,
    request?: TSocketRequestProps<T> extends never
      ? undefined
      : TSocketRequestProps<T>
  ): Observable<TSocketResponse<T>> {
    return this.derivApi.subscribe({
      [name]: 1,
      subscribe: 1,
      ...request,
    }) as Observable<TSocketResponse<T>>;
  }

  public authorize(token: string) {
    return this.derivApi.authorize({ authorize: token });
  }

  public logout() {
    this.derivApi.send({ logout: 1 });
  }

  private registerKeepAlive() {
    if (this.pingInterval) {
      const intervalID = this.pingInterval as unknown as number;
      clearInterval(intervalID);
    }

    if(this.reconnectionInterval) {
      const reconnectIntervalId = this.reconnectionInterval as unknown as number;
      clearInterval(reconnectIntervalId);
    }

    this.socket.addEventListener('open', () => {
      this.pingInterval = setInterval(() => {
        this.socket!.send(JSON.stringify({ ping: 1 }));
      }, PING_INTERVAL);      
    });

    this.socket.addEventListener('close', () => {
      const intervalID = this.pingInterval as unknown as number;
      clearInterval(intervalID);

      this.reconnectionInterval = setInterval(() => {
        const { serverUrl, appId } = getServerConfig();
        this.reset(appId, serverUrl, true);
      }, RECONNECTION_INTERVAL);

    });

    this.socket.addEventListener('error', () => {
      const intervalID = this.pingInterval as unknown as number;
      clearInterval(intervalID);
    });

  }

  public reset(appId: string, url: string, registerKeepAlive = false, language?: string) {
    const wsUrl = `wss://${url}/websockets/v3?app_id=${appId}`;    
    this.socket = new WebSocket(language ? wsUrl + `&l=${language.toUpperCase()}` : wsUrl);
    this.derivApi = new DerivAPIBasic({ connection: this.socket });
    if (registerKeepAlive) {
      this.registerKeepAlive();
    }
  }

  set connection(newConnection: WebSocket) {
    this.socket = newConnection;
  }

  get connection() {
    return this.socket;
  }

  set api(value: TDerivApi) {
    this.derivApi = value;
  }

  get api() {
    return this.derivApi;
  }
}

const apiManager = ApiManager.getInstance();
apiManager.init();
export default apiManager;
