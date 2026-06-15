import js from "@eslint/js";

export default [
  {
    ignores: ["dist/", "node_modules/", "coverage/"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}", "tests/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        clearInterval: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        document: "readonly",
        FormData: "readonly",
        localStorage: "readonly",
        Blob: "readonly",
        CustomEvent: "readonly",
        MediaRecorder: "readonly",
        MediaStream: "readonly",
        navigator: "readonly",
        RTCIceCandidate: "readonly",
        RTCPeerConnection: "readonly",
        RTCSessionDescription: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        URL: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
];
