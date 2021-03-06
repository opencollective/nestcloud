import * as Consul from 'consul';
import { get } from 'lodash';
import * as YAML from 'yamljs';
import { Logger } from '@nestjs/common';
import { IConfig, IKVResponse, sleep } from '@nestcloud/common';
import { Store } from './store';
import { ConfigSyncException } from './exceptions/config-sync.exception';

export class ConsulConfig implements IConfig {
    private readonly store = Store;
    private readonly consul: Consul;
    private readonly key: string;
    private readonly retryInterval: 5000;
    private watcher = null;
    private readonly logger = new Logger('ConfigModule');

    constructor(consul: Consul, key: string) {
        this.consul = consul;
        this.key = key;
    }

    async init() {
        while (true) {
            try {
                const result = await this.consul.kv.get<IKVResponse>(this.key);
                this.store.data = result ? YAML.parse(result.Value) : {};
                this.createWatcher();
                this.logger.log('ConfigModule initialized');
                break;
            } catch (e) {
                this.logger.error('Unable to initial ConfigModule, retrying...', e);
                await sleep(this.retryInterval);
            }
        }
    }

    watch<T extends any>(path: string, callback: (data: T) => void = () => void 0) {
        this.store.watch(path, callback);
    }

    getKey(): string {
        return this.key;
    }

    get<T extends any>(path?: string, defaults?): T {
        if (!path) {
            return Store.data;
        }
        return get(Store.data, path, defaults);
    }

    async set(path: string, value: any) {
        this.store.update(path, value);
        const yamlString = YAML.stringify(this.store.data);
        try {
            await this.consul.kv.set(this.key, yamlString);
        } catch (e) {
            throw new ConfigSyncException(e.message, e.stack);
        }
    }

    private createWatcher() {
        if (this.watcher) {
            this.watcher.end();
        }
        this.watcher = this.consul.watch({
            method: this.consul.kv.get,
            options: { key: this.key, wait: '5m' },
        });
        this.watcher.on('change', (data, res) => {
            try {
                this.store.data = data ? YAML.parse(data.Value) : {};
            } catch (e) {
                this.store.data = { parseErr: e };
            }
        });
        this.watcher.on('error', () => void 0);
    }
}
