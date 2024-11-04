import { appid } from 'project.config.json';

export default new (class Config {
  baseUrl = 'https://api.plink.link';
  appId = appid;
})();
