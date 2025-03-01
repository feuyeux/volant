<!-- markdownlint-disable MD033 MD045 -->

# Volant App

A translate app using tauri and langchain.

## 1 App Mechanism

**WRY** is a cross-platform WebView rendering library in Rust that supports all major desktop platforms like Windows, macOS, and Linux.

Tauri uses WRY as the abstract layer responsible to determine which webview is used (and how interactions are made).

**TAO**, cross-platform application window creation library in Rust that supports all major platforms like Windows, macOS, Linux, iOS and Android. Built for you, maintained for Tauri.

Inter-Process Communication (**IPC**) allows isolated processes to communicate securely and is key to building more complex applications.

```mermaid
%%{
  init: {
    'theme': 'base',
    'look': 'neo',
    'layout': 'elk',
    'themeVariables': {
      'primaryColor': '#BB2528',
      'primaryTextColor': '#fff',
      'primaryBorderColor': '#7C0000',
      'lineColor': '#F8B229',
      'secondaryColor': '#006100',
      'tertiaryColor': '#fff'
    }
  }
}%%
flowchart LR
    subgraph Frontend["前端"]
        A1["App.vue"]
        A2["main.ts"]
    end
    subgraph BuildServer["Vite 开发与构建"]
        B1["开发服务器启动 & HMR"]
        B2["静态资源构建/打包"]
    end
    subgraph Backend["后端"]
        C1["tauri.conf.json"]
        C2["Rust"]
        D1["Langchain-Rust"]
    end
    subgraph AI["Ollama"]
        D2["mistral-nemo"]
    end
    A1 -- 编写 Vue 应用 --> B1
    B1 -- 热更新支持 --> A1
    B1 -- 构建打包 --> B2
    B2 -- 生成静态资源 --> C2
    C2 -- 调用 AI --> D1
    D1 -- 请求 LLM  --> D2
    D2 -- 返回 AI 结果 --> D1
    D1 -- 翻译结果 --> C2
    A1 -. IPC invoke-translate .-> C2
    C2 -- Tauri 整合打包 --> E["生成安装包"]
    E -- 安装 -->  F["macOS 
    Windows 
    Linux 
    iOS 
    Android "]


```

<img src="img/volant-diagram.drawio.svg" style="width:600px" />

## 2 App Demo

"飞光飞光，劝尔一杯酒。吾不识青天高，黄地厚。"

<img src="img/volant_screenshot 2025-02-28 081113.png" style="width:600px" />

<img src="img/volant_hist_screenshot 2025-02-28 081059.png" style="width:600px" />

## 3 App Develop

```sh
# npm install --global yarn
# yarn add -D @tauri-apps/cli@latest
yarn tauri dev
```

### App Created by `create-tauri-app`

```sh
cargo create-tauri-app
✔ Project name · volant
✔ Identifier · org.feuyeux.tauri.volant
✔ Choose which language to use for your frontend · TypeScript / JavaScript - (pnpm, yarn, npm, deno, bun)
✔ Choose your package manager · yarn
✔ Choose your UI template · Vue - (https://vuejs.org/)
✔ Choose your UI flavor · TypeScript
```

## 4 App Distribute

```sh
# src-tauri/target/release/volant.exe
yarn tauri build
```

### [Android](https://tauri.app/start/prerequisites/#android)

```sh
# rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
yarn tauri android init
```

```sh
# src-tauri\gen\android\gradle\wrapper\gradle-wrapper.properties
# distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-8.9-bin.zip
yarn tauri android build --apk
```
