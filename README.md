# e-commerce-app

#### 介绍

电商工具App

## 集成 playwright 浏览器

核心原理

1. 将内置浏览器下载在resources/browsers目录下, 并在打包的时候将其包含在asarUnpack中

    ```json [package.json]
    {
      "scripts": {
        "install:browsers": "set \"PLAYWRIGHT_BROWSERS_PATH=resources/browsers\" && npx playwright install chromium"
      }
    }
    ```

    ```yml [electron-builder.yml]
    asarUnpack:
      - node_modules/@ffmpeg-installer/**
      - node_modules/@ffprobe-installer/**
   extraResources:
      - from: resources/browsers
        to: browsers
   ```

2. 支持用户信息记录

    ```js
    chromium.launchPersistentContext(userDataDir, launchOptions)
    ```
