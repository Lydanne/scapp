import Taro from '@tarojs/taro';
import { type } from '@tauri-apps/plugin-os';

export let WEAPP = Taro.getEnv() === Taro.ENV_TYPE.WEAPP;
export let WEB = Taro.getEnv() !== Taro.ENV_TYPE.WEAPP;
export let APP = Taro.getEnv() === Taro.ENV_TYPE.WEB && window.__TAURI__;
export let ANDROID = APP && type() === 'android';
export let IOS = APP && type() === 'ios';
export let QUEST = APP && type() === 'android'; //TODO
export let WINDOWS = APP && type() === 'windows';
export let LINUX = APP && type() === 'linux';
export let MAC = APP && type() === 'macos';
