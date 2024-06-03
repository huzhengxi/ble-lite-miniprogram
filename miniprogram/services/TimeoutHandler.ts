export interface TimeoutCallback {
  callbackId: Symbol;
  callback: () => void;
}
export class TimeoutHandler {
  private static timersId: { callbackId: Symbol; timerId: number }[] = [];
  private static timersCallback: TimeoutCallback[] = [];

  constructor() {
    // this.timersId = [];
    // this.timersCallback = [];
  }

  public static createCallback(callback: () => void): Symbol {
    const callbackId = Symbol();
    TimeoutHandler.timersCallback.push({ callbackId, callback });
    return callbackId;
  }

  public postDelayed(callbackId: Symbol, timeout: number): void {
    const timerId = setTimeout(() => {
      const callback = TimeoutHandler.timersCallback.find(
        (item) => item.callbackId === callbackId
      );
      if (callback) {
        callback.callback();
      }
    }, timeout);
    TimeoutHandler.timersId.push({ callbackId, timerId });
  }

  public removeCallbacks(callbackId: Symbol): void {
    const timerId = TimeoutHandler.timersId.find(
      (item) => item.callbackId === callbackId
    )?.timerId;
    if (timerId) {
      clearTimeout(timerId);
    }
    TimeoutHandler.timersId = TimeoutHandler.timersId.filter(
      (item) => item.callbackId !== callbackId
    );
    // TimeoutHandler.timersCallback = TimeoutHandler.timersCallback.filter(
    //   (item) => item.callbackId !== callbackId
    // );
  }

  public stop() {
    TimeoutHandler.timersId.forEach((item) => {
      clearTimeout(item.timerId);
    });
    // TimeoutHandler.timersId = [];
    // TimeoutHandler.timersCallback = [];
  }
}
