import { defineConfig } from "vite";

// デモページ（web/）のビルド設定。GitHub Pages では /gengo-arena/ の下に置かれるので、
// どこに置いても動くよう、読み込むファイルのパスを相対パスにする。
export default defineConfig({
  root: "web",
  base: "./",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
