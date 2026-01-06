export interface BaseAppConfig {
  name: string;
  title: string;
  ogImage?: string;
  userScalable?: boolean;
  webApp?: boolean;
}


declare module 'nuxt/schema' {
  interface AppConfigInput extends BaseAppConfig {}
  interface AppConfig extends BaseAppConfig {}
}

export {};
