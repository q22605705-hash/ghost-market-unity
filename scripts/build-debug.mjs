import { build } from "vite";

try {
  await build();
  console.log("build ok");
} catch (error) {
  console.error("build failed object:", error);
  console.error("name:", error?.name);
  console.error("message:", error?.message);
  console.error("stack:", error?.stack);
  process.exitCode = 1;
}
