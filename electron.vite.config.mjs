import { resolve, join } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig(({ command }) => {
  console.log(command)
  // const isDev = command === 'serve'
  // const isBuild = command === 'build'
  // const proxyUrl = isBuild ? 'http://www.cixun.vip' : 'http://127.0.0.1:6767'
  const proxyUrl = 'http://www.cixun.vip'

  return {
    main: {
      build: {
        watch: {},
        rollupOptions: {
          external: ['@ffmpeg-installer/ffmpeg', '@ffprobe-installer/ffprobe']
        }
      }
    },
    preload: {},
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src')
        }
      },
      plugins: [
        vue(),
        tailwindcss(),
        (monacoEditorPlugin.default || monacoEditorPlugin)({
          customDistPath: (root, buildOutDir) => {
            return join(buildOutDir, 'monacoeditorwork')
          }
        })
      ],
      server: {
        proxy: {
          '/api/e_commerce': {
            target: proxyUrl,
            changeOrigin: true
          }
        }
      }
    }
  }
})
