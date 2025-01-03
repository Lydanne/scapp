/// <reference types="@tarojs/taro" />

declare module "*.png";
declare module "*.gif";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
declare module "*.css";
declare module "*.less";
declare module "*.scss";
declare module "*.sass";
declare module "*.styl";

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_ENV:
      | "weapp"
      | "swan"
      | "alipay"
      | "h5"
      | "rn"
      | "tt"
      | "quickapp"
      | "qq"
      | "jd";
  }
}

declare interface Window {
  __TAURI__: {
    core: {
      invoke: (command: string, payload: any) => Promise<any>;
    };
  };
  invoke: (command: string, payload?: any) => Promise<any>;
}

declare module "*.wasm" {
  const content: any;
  export default content;
} 