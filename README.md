# net-speeder-for-windows
net-speeder for windows 在高延迟不稳定链路上优化单线程下载速度 

原项目: [net-speeder](https://github.com/snooda/net-speeder)

安装步骤：

1：Clone源码
```
git clone https://github.com/Srar/net-speeder-for-windows.git
```

2：安装依赖
```
npm install --unsafe
```

使用方法(需要administrator权限启动）：
```
#参数：node app.js --xt [倍率(默认1倍)] --filter [规则(默认"IP")]
#绝地求生十倍发包 
node app.js --xt 10 --filter "udp portrange 7000-8000"
#所有ip协议数据3倍发包
node app.js --xt 3
```