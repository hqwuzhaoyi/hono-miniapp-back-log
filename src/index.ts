import { serve } from "@hono/node-server";
import { Hono } from "hono";
import fs from "fs";

const logStream = fs.createWriteStream("output", { flags: "a" });

// 自定义函数，用于将带时间戳的日志写入文件
const logWithTimestamp = (message) => {
  const timestamp = new Date().toISOString(); // 当前时间
  const logMessage = `[${timestamp}] ${message}\n`; // 格式化日志信息
  logStream.write(logMessage); // 写入文件
  console.log(logMessage); // 仍然打印到控制台
};

let lastLogTime = 0;

const logThrottled = (message, interval = 1000) => {
  const currentTime = Date.now();
  if (currentTime - lastLogTime >= interval) {
    logWithTimestamp(message);
    lastLogTime = currentTime;
  }
};

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/", async (c) => {
  const body = await c.req.json(); // 获取 POST 请求的 JSON 数据

  // 打印接收到的对象
  console.log("Received object:", body);

  // 记录日志到文件
  logThrottled(`Received object: ${JSON.stringify(body)}`);

  // 返回成功响应
  return c.json({ message: "Data received successfully!", received: body });
});

app.get("/getOutput", (c) => {
  try {
    const fileContent = fs.readFileSync("output", "utf-8"); // 读取文件内容
    return c.text(fileContent); // 返回文件内容
  } catch (err) {
    console.error("Error reading output file:", err);
    return c.text("Error reading output file", 500); // 返回错误状态
  }
});

const port = 13280;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
