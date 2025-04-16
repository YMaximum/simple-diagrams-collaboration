import { useCallback, useEffect, useMemo, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { doc } from "@/data/ydoc";
import { stringToColor } from "@/utils/utils";

const cursorsMap = doc.getMap("cursors");
const cursorId = doc.clientID.toString();
const cursorColor = stringToColor(cursorId);

const MAX_IDLE_TIME = 10000;

export function useCursorStateSynced() {
  const [cursors, setCursors] = useState([]);
  const { screenToFlowPosition } = useReactFlow();

  // Flush any cursors that have gone stale.
  const flush = useCallback(() => {
    const now = Date.now();

    for (const [id, cursor] of cursorsMap) {
      if (now - cursor.timestamp > MAX_IDLE_TIME) {
        cursorsMap.delete(id);
      }
    }
  }, []);

  const onMouseMove = useCallback(
    (event) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      cursorsMap.set(cursorId, {
        id: cursorId,
        color: cursorColor,
        x: position.x,
        y: position.y,
        timestamp: Date.now(),
      });
    },
    [screenToFlowPosition]
  );

  useEffect(() => {
    const timer = window.setInterval(flush, MAX_IDLE_TIME);
    const observer = () => {
      setCursors([...cursorsMap.values()]);
    };

    flush();
    setCursors([...cursorsMap.values()]);
    cursorsMap.observe(observer);

    return () => {
      cursorsMap.unobserve(observer);
      window.clearInterval(timer);
    };
  }, [flush]);

  const cursorsWithoutSelf = useMemo(
    () => cursors.filter(({ id }) => id !== cursorId),
    [cursors]
  );

  return [cursorsWithoutSelf, onMouseMove];
}

export default useCursorStateSynced;
