import Taro from '@tarojs/taro';

export let WEAPP = Taro.getEnv() === Taro.ENV_TYPE.WEAPP;
export let WEB = Taro.getEnv() !== Taro.ENV_TYPE.WEAPP;
export let APP = Taro.getEnv() === Taro.ENV_TYPE.WEB && window.__TAURI__;
export let ANDROID = false;
export let IOS = false;
export let QUEST = false;
export let WINDOWS = false;
export let LINUX = false;
export let MAC = false;
