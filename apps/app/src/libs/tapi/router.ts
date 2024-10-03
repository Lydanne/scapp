import Taro from "@tarojs/taro";
import { useEffect, useRef } from "react";

export class Router {
  static singleProps: any = undefined;
  constructor() {}

  to(path: string, props: any) {
    Router.singleProps = props;
    return new Promise((resolve, reject) => {
      Taro.navigateTo({
        url: path,
        success: resolve,
        fail: reject,
      });
    });
  }

  back() {
    return new Promise((resolve, reject) => {
      Taro.navigateBack({
        success: resolve,
        fail: reject,
      });
    });
  }
}

export const router = new Router();

export function useRouter() {
  const props = useRef(Router.singleProps);
  useEffect(() => {
    Router.singleProps = undefined;
  }, []);
  return {
    to: router.to.bind(router),
    back: router.back.bind(router),
    props: props.current,
  };
}
