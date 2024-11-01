import { ParamsType } from './type-tools';

export class Emitter<CB extends (...args: any[]) => void> {
  private events = new Set<CB>();
  private lastEmitArgs: ParamsType<CB> | undefined;
  private timer: any;
  constructor(private debounce?: number | undefined) {}

  size() {
    return this.events.size;
  }

  emitSync(...args: ParamsType<CB>) {
    const p: void[] = [];
    this.events.forEach((cb) => {
      const lastCall = (cb as any).lastCall ?? 0;
      const interval = (cb as any).interval;
      if (Date.now() - lastCall < interval) {
        return;
      }
      (cb as any).lastCall = Date.now();
      p.push(cb(...args));
    });
    return p;
  }

  emitLifeCycle(...args: ParamsType<CB>) {
    this.lastEmitArgs = args;
    return Promise.resolve().then(() => {
      try {
        this.emitSync(...args);
      } catch (error) {
        return Promise.reject(error);
      }
    });
  }

  emit(...args: ParamsType<CB>) {
    this.lastEmitArgs = undefined;
    return new Promise<void>((resolve, reject) => {
      if (this.debounce === undefined) {
        Promise.resolve().then(() => {
          try {
            this.emitSync(...args);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      } else {
        if (this.timer) {
          clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
          try {
            this.emitSync(...args);
            resolve();
          } catch (error) {
            return Promise.reject(error);
          }
        }, this.debounce);
      }
    });
  }

  on(cb: CB, interval = 0) {
    (cb as any).interval = interval;
    if (this.lastEmitArgs) {
      cb(...this.lastEmitArgs);
    }
    this.events.add(cb);
    return () => {
      this.off(cb);
    };
  }

  wait() {
    return new Promise<ParamsType<CB>>((resolve) => {
      const cb = (...args: ParamsType<CB>) => {
        resolve(args);
        clear();
      };
      const clear = this.on(cb as CB);
    });
  }

  waitTimeout(timeout: number) {
    return new Promise<ParamsType<CB>>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('timeout'));
        clear();
      }, timeout);
      const cb = (...args: ParamsType<CB>) => {
        resolve(args);
        clearTimeout(timer);
        clear();
      };
      const clear = this.on(cb as CB);
    });
  }

  async first(): Promise<ParamsType<CB>[0]> {
    const [first] = await this.wait();
    return first;
  }

  off(cb: CB) {
    this.events.delete(cb);
  }

  destroy() {
    this.events.clear();
  }
}
