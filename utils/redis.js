// 仅供云函数/Node 服务端使用，小程序 pages 与 app.js 请勿 require 本文件
const Redis = require('ioredis');

let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis({
      host: 'localhost',
      port: 6379,
      db: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis 连接失败:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis 连接成功');
    });
  }
  return redisClient;
}

module.exports = {
  getRedisClient
};
