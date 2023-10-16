// vite.config.ts
import { defineConfig } from "file:///Volumes/personal/www/libs/gif-parser/node_modules/.pnpm/vite@4.4.11/node_modules/vite/dist/node/index.js";
import dts from "file:///Volumes/personal/www/libs/gif-parser/node_modules/.pnpm/vite-plugin-dts@2.3.0_vite@4.4.11/node_modules/vite-plugin-dts/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  return {
    plugins: [
      dts({
        copyDtsFiles: true
      })
    ],
    build: {
      lib: {
        entry: "./index.ts",
        name: "GIFParser",
        fileName: "gif-parser",
        formats: ["es", "iife"]
      },
      sourcemap: mode !== "production"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVm9sdW1lcy9wZXJzb25hbC93d3cvbGlicy9naWYtcGFyc2VyL3BhY2thZ2VzL2NvcmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Wb2x1bWVzL3BlcnNvbmFsL3d3dy9saWJzL2dpZi1wYXJzZXIvcGFja2FnZXMvY29yZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVm9sdW1lcy9wZXJzb25hbC93d3cvbGlicy9naWYtcGFyc2VyL3BhY2thZ2VzL2NvcmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICBkdHMoe1xuICAgICAgICBjb3B5RHRzRmlsZXM6IHRydWVcbiAgICAgIH0pXG4gICAgXSxcbiAgICBidWlsZDoge1xuICAgICAgbGliOiB7XG4gICAgICAgIGVudHJ5OiAnLi9pbmRleC50cycsXG4gICAgICAgIG5hbWU6ICdHSUZQYXJzZXInLFxuICAgICAgICBmaWxlTmFtZTogJ2dpZi1wYXJzZXInLFxuICAgICAgICBmb3JtYXRzOiBbJ2VzJywgJ2lpZmUnXVxuICAgICAgfSxcbiAgICAgIHNvdXJjZW1hcDogbW9kZSAhPT0gJ3Byb2R1Y3Rpb24nXG4gICAgfVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyVSxTQUFTLG9CQUFvQjtBQUN4VyxPQUFPLFNBQVM7QUFFaEIsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLE1BQ1AsSUFBSTtBQUFBLFFBQ0YsY0FBYztBQUFBLE1BQ2hCLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxLQUFLO0FBQUEsUUFDSCxPQUFPO0FBQUEsUUFDUCxNQUFNO0FBQUEsUUFDTixVQUFVO0FBQUEsUUFDVixTQUFTLENBQUMsTUFBTSxNQUFNO0FBQUEsTUFDeEI7QUFBQSxNQUNBLFdBQVcsU0FBUztBQUFBLElBQ3RCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
