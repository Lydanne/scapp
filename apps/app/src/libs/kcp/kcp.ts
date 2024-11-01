// KCP 协议中的一些常量
const IKCP_RTO_NDL = 30; // 最小重传超时时间
const IKCP_RTO_MIN = 100; // 最小重传超时时间
const IKCP_RTO_DEF = 200; // 默认重传超时时间
const IKCP_RTO_MAX = 60000; // 最大重传超时时间
const IKCP_CMD_PUSH = 81; // cmd: 推送数据
const IKCP_CMD_ACK = 82; // cmd: ACK命令
const IKCP_CMD_WASK = 83; // cmd: 窗口探测
const IKCP_CMD_WINS = 84; // cmd: 窗口大小
const IKCP_ASK_SEND = 1; // 需要发送
const IKCP_ASK_TELL = 2; // 需要通知
const IKCP_WND_SND = 32; // 发送窗口大小
const IKCP_WND_RCV = 128; // 接收窗口大小
const IKCP_MTU_DEF = 1400; // 默认MTU大小
const IKCP_INTERVAL = 100; // 内部更新时钟
const IKCP_OVERHEAD = 24; // KCP头部大小
const IKCP_DEADLINK = 20; // 最大重传次数
const IKCP_PROBE_INIT = 7000; // 探测窗口的初始时间
const IKCP_PROBE_LIMIT = 120000; // 探测窗口的最大时间
const IKCP_THRESH_MIN = 2; // 最小阈值
const IKCP_THRESH_INIT = 2; // 初始阈值

// KCP 数据包结构
interface KCPSegment {
  conv: number; // 会话ID
  cmd: number; // 命令
  frg: number; // 分片序号
  wnd: number; // 窗口大小
  ts: number; // 时间戳
  sn: number; // 序列号
  una: number; // 确认序号
  resendts: number; // 重传时间戳
  rto: number; // 超时重传时间
  fastack: number; // 快速重传计数
  xmit: number; // 传输次数
  data: Uint8Array; // 数据
}

export class KCP {
  private conv: number; // 会话ID
  private mtu: number; // 最大传输单元
  private mss: number; // 最大分片大小
  private state: number; // 连接状态
  private snd_una: number; // 第一个未确认的包
  private snd_nxt: number; // 下一个待发送的包
  private rcv_nxt: number; // 下一个待接收的包
  private ssthresh: number; // 拥塞窗口阈值
  private rx_rttval: number; // RTT变化量
  private rx_srtt: number; // 平滑RTT
  private rx_rto: number; // 超时重传时间
  private rx_minrto: number; // 最小RTO
  private snd_wnd: number; // 发送窗口
  private rcv_wnd: number; // 接收窗口
  private rmt_wnd: number; // 远端窗口
  private cwnd: number; // 拥塞窗口
  private interval: number; // 内部时钟间隔
  private ts_flush: number; // 下次刷新时间
  private nodelay: number; // 是否启用快速模式
  private updated: boolean; // 是否更新过
  private snd_queue: KCPSegment[]; // 发送队列
  private rcv_queue: KCPSegment[]; // 接收队列
  private snd_buf: KCPSegment[]; // 发送缓存
  private rcv_buf: KCPSegment[]; // 接收缓存
  private output: (data: Uint8Array, sender: string) => void; // 输出回调函数
  private current: number = 0; // 当前时间戳
  private probe_wait: number = 0; // 探测等待时间
  private probe_cnt: number = 0; // 探测计数器
  private ts_probe: number = 0; // 探测时间戳
  private probe: number = 0; // 探测标志
  private incr: number = 0; // 窗口增量
  private fastresend: number = 0; // 快速重传阈值
  private nocwnd: number = 0; // 是否关闭拥塞控制
  private stream: number = 0; // 是否为流模式
  private dead_link: number = IKCP_DEADLINK; // 最大重传次数
  private buffer: Uint8Array = new Uint8Array(IKCP_MTU_DEF); // 内部缓冲区
  private acklist: number[] = []; // ACK列表
  private ackcount: number = 0; // 当前ACK数量
  private ackblock: number = 16; // ACK块大小

  // 添加日志相关属性
  private logMask: number = 0;
  private logger?: (log: string, level: number) => void;

  // 添加性能统计属性
  private minrto: number = IKCP_RTO_MIN;
  private rx_rto_min: number = IKCP_RTO_MIN;
  private rx_rto_max: number = IKCP_RTO_MAX;
  private rx_total: number = 0; // 总接收字节数
  private tx_total: number = 0; // 总发送字节数
  private rx_srtt_init: boolean = false; // 是否初始化了srtt

  constructor(
    conv: number,
    output: (data: Uint8Array, sender: string) => void,
  ) {
    this.conv = conv;
    this.output = output;
    this.mtu = IKCP_MTU_DEF;
    this.mss = this.mtu - IKCP_OVERHEAD;
    this.state = 0;
    this.snd_una = 0;
    this.snd_nxt = 0;
    this.rcv_nxt = 0;
    this.ssthresh = IKCP_WND_SND;
    this.rx_rttval = 0;
    this.rx_srtt = 0;
    this.rx_rto = IKCP_RTO_DEF;
    this.rx_minrto = IKCP_RTO_MIN;
    this.snd_wnd = IKCP_WND_SND;
    this.rcv_wnd = IKCP_WND_RCV;
    this.rmt_wnd = IKCP_WND_RCV;
    this.cwnd = 0;
    this.interval = IKCP_INTERVAL;
    this.ts_flush = IKCP_INTERVAL;
    this.nodelay = 0;
    this.updated = false;
    this.snd_queue = [];
    this.rcv_queue = [];
    this.snd_buf = [];
    this.rcv_buf = [];
  }

  // 发送数据
  send(data: Uint8Array): number {
    if (data.length === 0) {
      return -1;
    }

    let offset = 0;
    let count: number;

    // 流模式下尝试合并小数据包
    if (this.stream) {
      if (this.snd_queue.length > 0) {
        const last = this.snd_queue[this.snd_queue.length - 1];
        if (last.data.length < this.mss) {
          const capacity = this.mss - last.data.length;
          const extend = Math.min(data.length, capacity);
          const newData = new Uint8Array(last.data.length + extend);
          newData.set(last.data);
          newData.set(data.subarray(0, extend), last.data.length);
          last.data = newData;
          offset = extend;
        }
      }
      if (offset < data.length) {
        count = Math.ceil((data.length - offset) / this.mss);
      } else {
        return 0;
      }
    } else {
      count = Math.ceil(data.length / this.mss);
    }

    if (count > 255) return -2;
    if (count === 0) count = 1;

    // 分片发送
    for (let i = 0; i < count; i++) {
      let size = Math.min(this.mss, data.length - offset);
      let seg: KCPSegment = {
        conv: this.conv,
        cmd: IKCP_CMD_PUSH,
        frg: this.stream ? 0 : count - i - 1,
        wnd: 0,
        ts: 0,
        sn: 0,
        una: 0,
        resendts: 0,
        rto: 0,
        fastack: 0,
        xmit: 0,
        data: new Uint8Array(data.buffer, offset, size),
      };
      this.snd_queue.push(seg);
      offset += size;
      this.tx_total += size;
    }

    return 0;
  }

  // 接收数据
  recv(buffer: Uint8Array): number {
    if (this.rcv_queue.length === 0) {
      return -1;
    }

    let peeksize = this.peeksize();
    if (peeksize < 0) {
      return -2;
    }

    if (peeksize > buffer.length) {
      return -3;
    }

    let recover = this.rcv_queue.length >= this.rcv_wnd;
    let offset = 0;

    // 将接收队列中的数据拷贝到buffer中
    while (this.rcv_queue.length > 0) {
      let seg = this.rcv_queue[0];
      buffer.set(seg.data, offset);
      offset += seg.data.length;

      if (seg.frg === 0) {
        this.rcv_queue.shift();
        break;
      }
      this.rcv_queue.shift();
    }

    // 移动接收缓存中的数据到接收队列
    while (this.rcv_buf.length > 0) {
      let seg = this.rcv_buf[0];
      if (seg.sn === this.rcv_nxt && this.rcv_queue.length < this.rcv_wnd) {
        this.rcv_buf.shift();
        this.rcv_queue.push(seg);
        this.rcv_nxt++;
      } else {
        break;
      }
    }

    return offset;
  }

  // 更新KCP状态
  update(current: number): void {
    this.current = current;

    if (!this.updated) {
      this.updated = true;
      this.ts_flush = this.current;
    }

    let slap = this.current - this.ts_flush;

    if (slap >= 10000 || slap < -10000) {
      this.ts_flush = this.current;
      slap = 0;
    }

    if (slap >= 0) {
      this.ts_flush += this.interval;
      if (this.current >= this.ts_flush) {
        this.ts_flush = this.current + this.interval;
      }
      this.flush();
    }
  }

  // 检查下次需要更新的时间
  check(current: number): number {
    if (!this.updated) {
      return current;
    }

    let ts_flush = this.ts_flush;
    let tm_packet = 0x7fffffff;

    if (current - ts_flush >= 10000 || current - ts_flush < -10000) {
      ts_flush = current;
    }

    if (current >= ts_flush) {
      return current;
    }

    return ts_flush;
  }

  // 获取下一个数据包大小
  private peeksize(): number {
    if (this.rcv_queue.length === 0) {
      return -1;
    }

    let seg = this.rcv_queue[0];
    if (seg.frg === 0) {
      return seg.data.length;
    }

    if (this.rcv_queue.length < seg.frg + 1) {
      return -1;
    }

    let length = 0;
    for (let i = 0; i < this.rcv_queue.length; i++) {
      seg = this.rcv_queue[i];
      length += seg.data.length;
      if (seg.frg === 0) {
        break;
      }
    }
    return length;
  }

  // 刷新数据
  private flush(): void {
    // 检查是否初始化
    if (!this.updated) {
      return;
    }

    let seg: KCPSegment = {
      conv: this.conv,
      cmd: IKCP_CMD_ACK,
      frg: 0,
      wnd: this.wnd_unused(),
      ts: this.current,
      sn: 0,
      una: this.rcv_nxt,
      resendts: 0,
      rto: 0,
      fastack: 0,
      xmit: 0,
      data: new Uint8Array(0),
    };

    // 发送ACK列表
    this.flush_acks();

    // 处理窗口探测
    if (this.probe & IKCP_ASK_SEND) {
      // 发送窗口探测请求
      const seg: KCPSegment = {
        conv: this.conv,
        cmd: IKCP_CMD_WASK,
        frg: 0,
        wnd: this.wnd_unused(),
        ts: this.current,
        sn: 0,
        una: this.rcv_nxt,
        resendts: 0,
        rto: 0,
        fastack: 0,
        xmit: 0,
        data: new Uint8Array(0),
      };
      this.output_segment(seg);
    }

    if (this.probe & IKCP_ASK_TELL) {
      // 发送窗口通知
      const seg: KCPSegment = {
        conv: this.conv,
        cmd: IKCP_CMD_WINS,
        frg: 0,
        wnd: this.wnd_unused(),
        ts: this.current,
        sn: 0,
        una: this.rcv_nxt,
        resendts: 0,
        rto: 0,
        fastack: 0,
        xmit: 0,
        data: new Uint8Array(0),
      };
      this.output_segment(seg);
    }

    this.probe = 0;

    // 计算拥塞窗口大小
    this.update_cwnd();

    // 移动发送窗口
    this.flush_send_data();
  }

  // 计算可用窗口大小
  private wnd_unused(): number {
    if (this.rcv_queue.length < this.rcv_wnd) {
      return this.rcv_wnd - this.rcv_queue.length;
    }
    return 0;
  }

  // 发送ACK列表
  private flush_acks(): void {
    if (this.acklist.length === 0) {
      return;
    }

    for (let i = 0; i < this.acklist.length; i += 2) {
      const sn = this.acklist[i];
      const ts = this.acklist[i + 1];
      if (this.ackcount < this.ackblock) {
        this.send_ack(sn, ts);
        this.ackcount++;
      }
    }
    this.acklist = [];
    this.ackcount = 0;
  }

  // 发送ACK包
  private send_ack(sn: number, ts: number): void {
    const seg: KCPSegment = {
      conv: this.conv,
      cmd: IKCP_CMD_ACK,
      frg: 0,
      wnd: this.wnd_unused(),
      ts: ts,
      sn: sn,
      una: this.rcv_nxt,
      resendts: 0,
      rto: 0,
      fastack: 0,
      xmit: 0,
      data: new Uint8Array(0),
    };
    this.output_segment(seg);
  }

  // 修改probe_window_size方法，完善窗口探测机制
  private probe_window_size(): void {
    // 如果远端窗口大小为0，发送窗口探测包
    if (this.rmt_wnd === 0) {
      if (this.probe_wait === 0) {
        this.probe_wait = IKCP_PROBE_INIT;
        this.ts_probe = this.current + this.probe_wait;
      } else {
        if (this.current >= this.ts_probe) {
          if (this.probe_wait < IKCP_PROBE_INIT) {
            this.probe_wait = IKCP_PROBE_INIT;
          }
          this.probe_wait += this.probe_wait / 2;
          if (this.probe_wait > IKCP_PROBE_LIMIT) {
            this.probe_wait = IKCP_PROBE_LIMIT;
          }
          this.ts_probe = this.current + this.probe_wait;
          this.probe |= IKCP_ASK_SEND;
        }
      }
    } else {
      this.ts_probe = 0;
      this.probe_wait = 0;
    }
  }

  // 发送数据
  private flush_send_data(): void {
    // 将发送队列中的数据移动到发送缓存
    while (
      this.snd_queue.length > 0 &&
      this.snd_nxt < this.snd_una + this.snd_wnd &&
      this.snd_queue.length < this.rmt_wnd
    ) {
      const seg = this.snd_queue.shift()!;
      seg.conv = this.conv;
      seg.cmd = IKCP_CMD_PUSH;
      seg.sn = this.snd_nxt;
      this.snd_buf.push(seg);
      this.snd_nxt++;
    }

    // 检查超时重传
    const current = this.current;
    let change = 0;
    let lost = 0;
    let resend = 0;

    for (let i = 0; i < this.snd_buf.length; i++) {
      const segment = this.snd_buf[i];
      let needsend = false;

      if (segment.xmit === 0) {
        needsend = true;
        segment.xmit++;
        segment.rto = this.rx_rto;
        segment.resendts = current + segment.rto;
      } else if (current >= segment.resendts) {
        needsend = true;
        segment.xmit++;
        segment.rto += Math.max(segment.rto, this.rx_rto);
        segment.resendts = current + segment.rto;
        lost++;
        resend++;
      }

      if (needsend) {
        segment.ts = current;
        segment.wnd = this.wnd_unused();
        segment.una = this.rcv_nxt;

        const need = IKCP_OVERHEAD + segment.data.length;
        this.output_segment(segment);
      }
    }
  }

  // 输出数据段
  private output_segment(segment: KCPSegment): void {
    const buffer = new Uint8Array(IKCP_OVERHEAD + segment.data.length);
    let offset = 0;

    // 写入协议��
    this.encode32u(buffer, offset, segment.conv);
    offset += 4;
    buffer[offset++] = segment.cmd;
    buffer[offset++] = segment.frg;
    buffer[offset++] = segment.wnd;
    this.encode32u(buffer, offset, segment.ts);
    offset += 4;
    this.encode32u(buffer, offset, segment.sn);
    offset += 4;
    this.encode32u(buffer, offset, segment.una);
    offset += 4;
    this.encode32u(buffer, offset, segment.data.length);
    offset += 4;

    // 写入数据
    if (segment.data.length > 0) {
      buffer.set(segment.data, offset);
    }

    this.output(buffer, 'kcp1');
  }

  // 32位整数编码
  private encode32u(buf: Uint8Array, offset: number, l: number): void {
    buf[offset] = l & 0xff;
    buf[offset + 1] = (l >>> 8) & 0xff;
    buf[offset + 2] = (l >>> 16) & 0xff;
    buf[offset + 3] = (l >>> 24) & 0xff;
  }

  // 32位整数解码
  private decode32u(buf: Uint8Array, offset: number): number {
    return (
      ((buf[offset + 3] << 24) |
        (buf[offset + 2] << 16) |
        (buf[offset + 1] << 8) |
        buf[offset]) >>>
      0
    );
  }

  // 设置是否为流模式
  setStreamMode(stream: boolean): void {
    this.stream = stream ? 1 : 0;
  }

  // 设最大窗口大小
  setWndSize(sndwnd: number, rcvwnd: number): void {
    if (sndwnd > 0) {
      this.snd_wnd = sndwnd;
    }
    if (rcvwnd > 0) {
      this.rcv_wnd = rcvwnd;
    }
  }

  // 设置最大传输单元
  setMtu(mtu: number): number {
    if (mtu < 50 || mtu < IKCP_OVERHEAD) {
      return -1;
    }
    const buffer = new Uint8Array(mtu);
    this.mtu = mtu;
    this.mss = mtu - IKCP_OVERHEAD;
    this.buffer = buffer;
    return 0;
  }

  // 设置快速重传
  setFastresend(fastresend: number): void {
    this.fastresend = fastresend;
  }

  // 设置是否关闭拥塞控制
  setNocwnd(nocwnd: boolean): void {
    this.nocwnd = nocwnd ? 1 : 0;
  }

  // 设置最大重传次数
  setDeadLink(deadLink: number): void {
    this.dead_link = deadLink;
  }

  // 输入一个数据包
  input(data: Uint8Array): number {
    if (data.length < IKCP_OVERHEAD) {
      return -1;
    }

    let offset = 0;
    let flag = 0;
    let maxack = 0;
    const old_una = this.snd_una;

    while (offset + IKCP_OVERHEAD <= data.length) {
      const conv = this.decode32u(data, offset);
      offset += 4;
      if (conv !== this.conv) {
        return -1;
      }

      const cmd = data[offset++];
      const frg = data[offset++];
      const wnd = data[offset++];
      const ts = this.decode32u(data, offset);
      offset += 4;
      const sn = this.decode32u(data, offset);
      offset += 4;
      const una = this.decode32u(data, offset);
      offset += 4;
      const len = this.decode32u(data, offset);
      offset += 4;

      if (offset + len > data.length) {
        return -2;
      }

      if (
        cmd !== IKCP_CMD_PUSH &&
        cmd !== IKCP_CMD_ACK &&
        cmd !== IKCP_CMD_WASK &&
        cmd !== IKCP_CMD_WINS
      ) {
        return -3;
      }

      this.rmt_wnd = wnd;
      this.parse_una(una);
      this.shrink_buf();

      if (cmd === IKCP_CMD_ACK) {
        if (this.current >= ts) {
          this.update_ack(this.current - ts);
        }
        this.parse_ack(sn);
        this.shrink_buf();
        if (flag === 0) {
          flag = 1;
          maxack = sn;
        } else if (sn > maxack) {
          maxack = sn;
        }
      } else if (cmd === IKCP_CMD_PUSH) {
        if (sn < this.rcv_nxt + this.rcv_wnd) {
          this.ack_push(sn, ts);
          if (sn >= this.rcv_nxt) {
            const segment: KCPSegment = {
              conv,
              cmd: IKCP_CMD_PUSH,
              frg,
              wnd,
              ts,
              sn,
              una,
              resendts: 0,
              rto: 0,
              fastack: 0,
              xmit: 0,
              data: new Uint8Array(data.buffer, offset, len),
            };
            this.rx_total += len;
            this.parse_data(segment);
          }
        }
      } else if (cmd === IKCP_CMD_WASK) {
        this.probe |= IKCP_ASK_TELL;
      } else if (cmd === IKCP_CMD_WINS) {
        // do nothing
      } else {
        return -3;
      }

      offset += len;
    }

    if (flag !== 0) {
      this.parse_fastack(maxack);
    }

    if (this.snd_una > old_una && this.cwnd < this.rmt_wnd) {
      const mss = this.mss;
      if (this.cwnd < this.ssthresh) {
        this.cwnd++;
        this.incr += mss;
      } else {
        if (this.incr < mss) {
          this.incr = mss;
        }
        this.incr += (mss * mss) / this.incr + mss / 16;
        if ((this.cwnd + 1) * mss <= this.incr) {
          this.cwnd++;
        }
      }
      if (this.cwnd > this.rmt_wnd) {
        this.cwnd = this.rmt_wnd;
        this.incr = this.rmt_wnd * mss;
      }
    }

    return 0;
  }

  // 析确认包
  private parse_ack(sn: number): void {
    if (sn < this.snd_una || sn >= this.snd_nxt) {
      return;
    }

    for (let i = 0; i < this.snd_buf.length; i++) {
      const seg = this.snd_buf[i];
      if (sn === seg.sn) {
        this.snd_buf.splice(i, 1);
        break;
      }
      if (sn < seg.sn) {
        break;
      }
    }
  }

  // 更新RTT
  private update_ack(rtt: number): void {
    if (this.rx_srtt === 0) {
      this.rx_srtt = rtt;
      this.rx_rttval = rtt / 2;
    } else {
      let delta = rtt - this.rx_srtt;
      if (delta < 0) {
        delta = -delta;
      }
      this.rx_rttval = (3 * this.rx_rttval + delta) / 4;
      this.rx_srtt = (7 * this.rx_srtt + rtt) / 8;
      if (this.rx_srtt < 1) {
        this.rx_srtt = 1;
      }
    }
    const rto = this.rx_srtt + Math.max(this.interval, 4 * this.rx_rttval);
    this.rx_rto = Math.min(Math.max(this.rx_minrto, rto), IKCP_RTO_MAX);
  }

  // 解析UNA
  private parse_una(una: number): void {
    let count = 0;
    for (let i = 0; i < this.snd_buf.length; i++) {
      const seg = this.snd_buf[i];
      if (una > seg.sn) {
        count++;
      } else {
        break;
      }
    }
    if (count > 0) {
      this.snd_buf.splice(0, count);
    }
  }

  // 收缩发送缓冲区
  private shrink_buf(): void {
    if (this.snd_buf.length > 0) {
      const seg = this.snd_buf[0];
      this.snd_una = seg.sn;
    } else {
      this.snd_una = this.snd_nxt;
    }
  }

  // 处理ACK推送
  private ack_push(sn: number, ts: number): void {
    this.acklist.push(sn, ts);
  }

  // 解析数据包
  private parse_data(segment: KCPSegment): void {
    const sn = segment.sn;

    if (sn >= this.rcv_nxt + this.rcv_wnd || sn < this.rcv_nxt) {
      return;
    }

    let repeat = false;
    let new_index = this.rcv_buf.length;

    for (let i = 0; i < this.rcv_buf.length; i++) {
      const seg = this.rcv_buf[i];
      if (seg.sn === sn) {
        repeat = true;
        break;
      }
      if (seg.sn > sn) {
        new_index = i;
        break;
      }
    }

    if (!repeat) {
      this.rcv_buf.splice(new_index, 0, segment);
    }

    // 移动可用的分片到接收队列
    this.move_rcv_data();
  }

  // 处理快速重传
  private parse_fastack(sn: number): void {
    if (sn < this.snd_una || sn >= this.snd_nxt) {
      return;
    }

    for (const seg of this.snd_buf) {
      if (sn < seg.sn) {
        break;
      } else if (sn !== seg.sn) {
        seg.fastack++;
      }
    }
  }

  // 移动接收数据到队列
  private move_rcv_data(): void {
    while (this.rcv_buf.length > 0) {
      const seg = this.rcv_buf[0];
      if (seg.sn === this.rcv_nxt && this.rcv_queue.length < this.rcv_wnd) {
        this.rcv_buf.shift();
        this.rcv_queue.push(seg);
        this.rcv_nxt++;
      } else {
        break;
      }
    }
  }

  // 设NoDelay参数
  setNoDelay(
    nodelay: number,
    interval: number = IKCP_INTERVAL,
    resend: number = 0,
    nc: number = 0,
  ): void {
    if (nodelay >= 0) {
      this.nodelay = nodelay;
      if (nodelay) {
        this.rx_minrto = IKCP_RTO_NDL;
      } else {
        this.rx_minrto = IKCP_RTO_MIN;
      }
    }
    if (interval >= 0) {
      if (interval > 5000) {
        interval = 5000;
      } else if (interval < 10) {
        interval = 10;
      }
      this.interval = interval;
    }
    if (resend >= 0) {
      this.fastresend = resend;
    }
    if (nc >= 0) {
      this.nocwnd = nc;
    }
  }

  // 获取等待发送的数据大小
  waitSnd(): number {
    return this.snd_buf.length + this.snd_queue.length;
  }

  // 修改update_cwnd方法，使用IKCP_THRESH_INIT
  private update_cwnd(): void {
    if (this.nocwnd) {
      return;
    }

    // 初始化拥塞窗口阈值
    if (this.ssthresh === 0) {
      this.ssthresh = IKCP_THRESH_INIT;
    }

    if (this.snd_una > this.ssthresh) {
      const mss = this.mss;
      if (this.cwnd < this.rmt_wnd) {
        if (this.cwnd < this.ssthresh) {
          // 慢启动阶段
          this.cwnd++;
          this.incr += mss;
        } else {
          // 拥塞避免阶段
          if (this.incr < mss) {
            this.incr = mss;
          }
          this.incr += (mss * mss) / this.incr + mss / 16;
          if ((this.cwnd + 1) * mss <= this.incr) {
            this.cwnd = Math.min(this.cwnd + 1, this.rmt_wnd);
          }
        }
      }
    } else {
      // 快速恢复阶段
      this.cwnd = Math.min(this.ssthresh, this.rmt_wnd);
      this.incr = this.cwnd * this.mss;
    }
  }

  // 修改shrink_cwnd方法
  private shrink_cwnd(): void {
    if (this.cwnd > 1) {
      // 发生丢包时，将拥塞窗口减半
      this.ssthresh = Math.max(this.cwnd / 2, IKCP_THRESH_MIN);
      this.cwnd = 1;
      this.incr = this.mss;
    }
  }

  // 添加新的方法：重置拥塞控制
  private reset_cwnd(): void {
    this.ssthresh = IKCP_THRESH_INIT;
    this.cwnd = 1;
    this.incr = this.mss;
  }

  // 获取当前RTT
  getRto(): number {
    return this.rx_rto;
  }

  // 获取当前RTT的平滑值
  getSrtt(): number {
    return this.rx_srtt;
  }

  // 获取当前发送窗口大小
  getSndWnd(): number {
    return this.snd_wnd;
  }

  // 获取当前接收窗口大小
  getRcvWnd(): number {
    return this.rcv_wnd;
  }

  // 获取当前可用发送窗口大小
  getSndBuf(): number {
    return this.snd_buf.length;
  }

  // 获取当前可用接收窗口大小
  getRcvBuf(): number {
    return this.rcv_buf.length;
  }

  // 获取当前状态
  getState(): number {
    return this.state;
  }

  // 设置最小RTO
  setMinRto(minrto: number): void {
    this.rx_minrto = minrto;
  }

  // 设置日志输出函数
  setLogMask(mask: number): void {
    this.logMask = mask;
  }

  // 清空缓冲区
  flush_buffer(): void {
    this.snd_buf = [];
    this.rcv_buf = [];
    this.snd_queue = [];
    this.rcv_queue = [];
  }

  // 重置连接
  reset(): void {
    this.conv = 0;
    this.snd_una = 0;
    this.snd_nxt = 0;
    this.rcv_nxt = 0;
    this.ssthresh = IKCP_WND_SND;
    this.rx_rttval = 0;
    this.rx_srtt = 0;
    this.rx_rto = IKCP_RTO_DEF;
    this.rx_minrto = IKCP_RTO_MIN;
    this.snd_wnd = IKCP_WND_SND;
    this.rcv_wnd = IKCP_WND_RCV;
    this.rmt_wnd = IKCP_WND_RCV;
    this.cwnd = 0;
    this.incr = 0;
    this.probe = 0;
    this.mtu = IKCP_MTU_DEF;
    this.mss = this.mtu - IKCP_OVERHEAD;
    this.stream = 0;
    this.buffer = new Uint8Array(this.mtu);
    this.flush_buffer();
  }

  // 获取当前时间
  private current_ms(): number {
    return Date.now();
  }

  // 检查是否需要快速重传
  private check_fastack(sn: number): boolean {
    if (this.fastresend <= 0) {
      return false;
    }
    return sn < this.snd_una && sn >= this.snd_una - this.fastresend;
  }

  // 设置日志函数
  setLogger(logger: (log: string, level: number) => void): void {
    this.logger = logger;
  }

  // 内部日志方法
  private log(message: string, level: number): void {
    if (this.logger && this.logMask & level) {
      this.logger(message, level);
    }
  }

  // 获取统计信息
  getStats(): {
    rx_total: number;
    tx_total: number;
    rx_srtt: number;
    rx_rttvar: number;
    rx_rto: number;
  } {
    return {
      rx_total: this.rx_total,
      tx_total: this.tx_total,
      rx_srtt: this.rx_srtt,
      rx_rttvar: this.rx_rttval,
      rx_rto: this.rx_rto,
    };
  }

  // 优化input方法中的数据处理
  private process_data(data: Uint8Array, offset: number, len: number): void {
    const seg = new Uint8Array(data.buffer, offset, len);
    this.rx_total += len;

    // 处理数据分片
    if (this.stream) {
      // 流模式处理
      this.process_stream_data(seg);
    } else {
      // 消息模式处理
      this.process_message_data(seg);
    }
  }

  // 流模式数据处理
  private process_stream_data(data: Uint8Array): void {
    if (this.rcv_queue.length > 0) {
      const last = this.rcv_queue[this.rcv_queue.length - 1];
      const newData = new Uint8Array(last.data.length + data.length);
      newData.set(last.data);
      newData.set(data, last.data.length);
      last.data = newData;
      last.frg = 0;
    } else {
      this.rcv_queue.push({
        conv: this.conv,
        cmd: IKCP_CMD_PUSH,
        frg: 0,
        wnd: this.wnd_unused(),
        ts: this.current,
        sn: this.rcv_nxt,
        una: this.snd_una,
        resendts: 0,
        rto: 0,
        fastack: 0,
        xmit: 0,
        data: data,
      });
    }
  }

  // 消息模式数据处理
  private process_message_data(data: Uint8Array): void {
    const seg: KCPSegment = {
      conv: this.conv,
      cmd: IKCP_CMD_PUSH,
      frg: 0,
      wnd: this.wnd_unused(),
      ts: this.current,
      sn: this.rcv_nxt,
      una: this.snd_una,
      resendts: 0,
      rto: 0,
      fastack: 0,
      xmit: 0,
      data: data,
    };
    this.rcv_queue.push(seg);
  }

  // 添加调试信息方法
  getDebugInfo(): string {
    return `KCP Debug Info:
            snd_una: ${this.snd_una}
            snd_nxt: ${this.snd_nxt}
            rcv_nxt: ${this.rcv_nxt}
            cwnd: ${this.cwnd}
            ssthresh: ${this.ssthresh}
            rx_rto: ${this.rx_rto}
            rx_srtt: ${this.rx_srtt}
            rx_rttval: ${this.rx_rttval}
            snd_wnd: ${this.snd_wnd}
            rcv_wnd: ${this.rcv_wnd}
            rmt_wnd: ${this.rmt_wnd}
            snd_queue: ${this.snd_queue.length}
            rcv_queue: ${this.rcv_queue.length}
            snd_buf: ${this.snd_buf.length}
            rcv_buf: ${this.rcv_buf.length}
        `.replace(/^\s+/gm, '');
  }
}
