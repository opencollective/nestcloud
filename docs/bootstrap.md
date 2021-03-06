# 本地配置

Boot 模块，用来在服务启动的时候读取本地一些必要的配置，如服务的名字，ID，以及服务的端口号等。

## 安装

```bash
npm install @nestcloud/boot --save
```

## 配置

在服务的入口文件同级目录下或者其他位置创建一个 YML 文件，例如 bootstrap-${env}.yml。

文件内容如下：

```yaml
consul:
  service:
    id: test
    name: test
    port: 3000
```

## 注册模块

```typescript
import { HttpModule, Module } from '@nestjs/common';
import { BootModule } from '@nestcloud/boot';

const env = process.env.NODE_ENV;

@Module({
    imports: [
        BootModule.register(__dirname, `bootstrap-${env}.yml`),
    ]
})
export class AppModule {
}
```

## 如何使用

有两种方式可以获取配置文件中的数据，一种是通过 get 函数获取，另一种是通过装饰器获取，代码如下：

### Get 方式获取配置

```typescript
import { Injectable } from '@nestjs/common';
import { InjectBoot, Boot } from '@nestcloud/boot';

@Injectable()
export class TestService {
    constructor(
        @InjectBoot() private readonly boot: Boot,
    ) {
    }
    
    test() {
        const serviceName = this.boot.get('consul.service.name', 'default-service');
    }
}
```

### 装饰器方式获取配置

```typescript
import { Injectable } from '@nestjs/common';
import { BootValue } from '@nestcloud/boot';

@Injectable()
export class TestService {
    @BootValue('consul.service.name', 'default-service')
    private readonly serviceName: string;
    
    test() {
        console.log(this.serviceName);
    }
}
```

## 模板编译.

使用了 [handlebars.js](https://github.com/wycats/handlebars.js) 模板引擎.

模板:

```typescript
process.env.SERVICE_ID = 'your-service-id';
process.env.SERVICE_NAME = 'your-service-name';
```

```yaml
service:
  id: ${{ SERVICE_ID }}
  name: ${{ SERVICE_NAME }}
  port: 3000
  address: http://${{ service.name }}:${{ service.port }}
```

编译后:

```yaml
service:
  id: your-service-id
  name: your-service-name
  port: 3000
  address: http://your-service-name:3000
```

## API 文档

### class BootModule

#### static register\(path: string, filename: string\): DynamicModule

注册 Nest Boot 模块

| field | type | description |
| :--- | :--- | :--- |
| path | string | 配置文件位置 |
| filename | string | 配置文件名称 |

### class Boot

#### get&lt;T&gt;\(path: string, defaults?: T\): T

获取配置

| field | type | description |
| :--- | :--- | :--- |
| path |  string | 获取指定路径的配置 |
| defaults | any | 如果指定路径的配置不存在则返回该值 |

#### getEnv\(\): string 

获取系统当前的 NODE\_ENV 值，如果没有设置，则返回 development

#### getFilename\(\): string

获取系统当前使用的配置文件名称

#### getConfigPath\(\): string

获取系统当前使用的配置文件路径，不包括配置文件名称

#### getFullConfigPath\(\): string

获取系统当前使用的配置文件路径，包括配置文件名称

### 装饰器

#### InjectBoot\(\): PropertyDecorator

注入 Boot 对象。

#### BootValue\(path: string, defaultValue?: any\): PropertyDecorator

自动为类的属性赋值

