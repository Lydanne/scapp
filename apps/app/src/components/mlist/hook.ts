import { useCallback, useState } from 'react';

import type { MitemProps } from './mitem';

export default function useMlist() {
  const [msgList, setMsgList] = useState<MitemProps[]>([]);
  const setMsgById = useCallback(
    (id: number, data: (p: MitemProps) => Partial<MitemProps> | null) => {
      setMsgList((list) => {
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i].id === id) {
            const newMsg = data(list[i]);
            if (!newMsg) return list;
            const updatedList = [...list];
            updatedList[i] = { ...updatedList[i], ...newMsg };
            return updatedList;
          }
        }
        return list;
      });
    },
    [],
  );
  const getMsgById = useCallback(
    (id: number) => {
      for (let i = msgList.length - 1; i >= 0; i--) {
        if (msgList[i].id === id) {
          return msgList[i];
        }
      }
      return null;
    },
    [msgList],
  );
  const appendMsg = useCallback((data: MitemProps) => {
    setMsgList((list) => [...list, data]);
  }, []);
  return { msgList, setMsgById, getMsgById, appendMsg };
}
