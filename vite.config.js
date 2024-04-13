import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default({ mode }) =>
    defineConfig(
    {
        base: "./",
        build: { target: "esnext" },
        assetsInclude: ["**/*.glb", "**/*.gltf"],

        resolve:
        {
            conditions: ["development", "browser"]
        },

        define:
        {
            DEBUG: mode !== "production" && false
        },

        plugins:
        [
            glsl({
                compress: mode === "production",
                root: "/src/shaders/"
            })
        ],

        server:
        {
            host: "0.0.0.0",
            port: 8080,
            open: true,
            headers:
            {
                // To use SharedArrayBuffer in preview mode:
                // https://github.com/vitejs/vite/issues/9864
                "Cross-Origin-Opener-Policy": "same-origin",
                "Cross-Origin-Embedder-Policy": "require-corp"
            }
        }
    });
