
import {
  DEFAULT_WS_SERVER, OAUTH_URL, VERCEL_DEPLOYMENT_APP_ID
} from './constants';

const CURRENCY_MAP = new Map([
  ['Demo', { icon: 'demo', name: 'Demo' }],
  ['tUSDT', { icon: 'tether', name: 'Tether TRC20' }],
  ['eUSDT', { icon: 'tether', name: 'Tether ERC20' }],
  ['BTC', { icon: 'bitcoin', name: 'Bitcoin' }],
  ['ETH', { icon: 'ethereum', name: 'Ethereum' }],
  ['LTC', { icon: 'litecoin', name: 'Litecoin' }],
  ['USDC', { icon: 'usdcoin', name: 'USD Coin' }],
  ['USD', { icon: 'usdollar', name: 'US Dollar' }],
  ['EUR', { icon: 'euro', name: 'Euro' }],
  ['GBP', { icon: 'gbp', name: 'British Pound' }],
  ['AUD', { icon: 'aud', name: 'Australian Dollar' }],
]);

export const domains = [
  'localhost:5173'
];

export const getCurrencyObject = (currency: string) => {
  const currencyObject = CURRENCY_MAP.get(currency);
  if (!currencyObject) {
    return {
      icon: 'placeholder_icon',
      name: 'Currency',
    };
  }

  return currencyObject;
};

type TIsNotDemoCurrency = {
  name: string;
  currency: string;
};

export const isNotDemoCurrency = (account: TIsNotDemoCurrency) => {
  const currency = account?.name?.includes('VRTC') ? 'Demo' : account?.currency;
  return currency;
};


/**
 * @description based on the environment which the project is running we must use different appIds, to get the proper redirect url
 * @returns {string} proper appId for the project
 */
export const getAppId = () => {
  return VERCEL_DEPLOYMENT_APP_ID;
};

/**
 * @description use this when you wanna check if the application is running on browser (not ssr)
 * @returns {boolean} true if the application is running in the browser ( not ssr )
 */
export const getIsBrowser = () => {
  return typeof window !== 'undefined';
};

export const formatTokenScope = (tokenScope: string) => {
  const cleanedTokenScope = tokenScope.replace(/-|_/g, ' ');
  return (
    cleanedTokenScope[0].toUpperCase() +
    cleanedTokenScope.slice(1).toLowerCase()
  );
};

export const getServerConfig = () => {
  const isBrowser = getIsBrowser();
  if (isBrowser) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const config_server_url = localStorage.getItem('config.server_url');
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const config_app_id = localStorage.getItem('config.app_id');

    return {
      serverUrl: config_server_url ?? DEFAULT_WS_SERVER,
      appId: config_app_id ?? getAppId(),
      oauth: config_server_url ?? OAUTH_URL,
    };
  }
  return {
    serverUrl: DEFAULT_WS_SERVER,
    appId: getAppId(),
    oauth: OAUTH_URL,
  };
};

export const generateLoginUrl = (
  language: string,
  oauthUrl: string,
  appId: string,
  route: string
) => {
  return `https://${oauthUrl}/oauth2/authorize?app_id=${appId}&l=${language}&route=${route}`;
};

interface IScopesLike {
  admin: boolean;
  read: boolean;
  trade: boolean;
  trading_information: boolean;
  payments: boolean;
}

export const scopesArrayToObject = (scopes: string[]) => {
  const scopesObject: IScopesLike = {
    admin: false,
    read: false,
    trade: false,
    trading_information: false,
    payments: false,
  };
  scopes.forEach((scope) => {
    const prop = scope as keyof IScopesLike;
    scopesObject[prop] = true;
  });
  return scopesObject;
};

export function formatNumber(n: number, maxFracDigits?: number) {  
  const { format } = Intl.NumberFormat('en', {
    maximumFractionDigits: maxFracDigits ?? 2,
  })

  const formattedNum = format(n).replace(',','');
  return Number(formattedNum);
}

export function replaceBarrierParam(barrier:string) {
  if(barrier.includes('+')) return barrier.replace('+', '-');  
  return barrier.replace('-', '+')  
}