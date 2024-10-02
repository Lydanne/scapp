# Taro Monorepo

## 目录框架

- apps/
  - vue-app => vue3 + ts + nutui4 + taro3
  - scapp => react18 + ts + nutui4 + taro3
- libs/
  - 存放你的项目库
- scripts/
  - 存放项目脚本的

## 提示

- ! 不要乱升级依赖可能会导致 BUG（本人已踩坑）
- ! 不要使用 pnpm，可以使用 yarn（本人已踩坑）
- ! taro4 的 vite 支持不是很好，是一个巨坑不建议使用
- ! 该项目推荐使用 yarn

## 功能

- monorepo 管理
- 目录的规范
- git 提交规范

## 运行

### 安装依赖

```bash
yarn
```

### 运行 APP

```bash
yarn workspace app run dev:weapp
```

## VSCode 插件推荐

### React 开发

```
名称: React Style Helper
ID: iceworks-team.iceworks-style-helper
说明: Easily write styles(CSS/LESS/SASS).
版本: 1.1.2
发布者: AppWorks Team
VS Marketplace 链接: https://marketplace.visualstudio.com/items?itemName=iceworks-team.iceworks-style-helper
```

```
名称: ES7+ React/Redux/React-Native snippets
ID: dsznajder.es7-react-js-snippets
说明: Extensions for React, React-Native and Redux in JS/TS with ES7+ syntax. Customizable. Built-in integration with prettier.
版本: 4.4.3
发布者: dsznajder
VS Marketplace 链接: https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets
```

### Vue 开发

```
名称: Vue - Official
ID: Vue.volar
说明: Language Support for Vue
版本: 2.1.6
发布者: Vue
VS Marketplace 链接: https://marketplace.visualstudio.com/items?itemName=Vue.volar
```

## About

MIT
