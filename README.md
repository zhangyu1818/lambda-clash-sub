# lambda-clash-sub
自用v2ray订阅转clash premium的lambda函数

1. 压缩所有文件包括`node_modules`。
2. 上传到Lambda函数
3. 通过API Gateway创建代理资源的方式访问，直接将v2ray订阅链接拼在`url`后面即可。

如`https://api-gateway/你的订阅链接`
