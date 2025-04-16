import { useCallback, useEffect, useState } from "react";
import { applyEdgeChanges } from "@xyflow/react";
import { doc } from "@/data/ydoc";

// Please see the comments in useNodesStateSynced.js.
// This is the same thing but for edges.
export const edgesMap = doc.getMap("edges");

function useEdgesStateSynced() {
  const [edges, setEdges] = useState([]);

  const setEdgesSynced = useCallback((edgesOrUpdater) => {
    const next =
      typeof edgesOrUpdater === "function"
        ? edgesOrUpdater([...edgesMap.values()])
        : edgesOrUpdater;

    const seen = new Set();

    for (const edge of next) {
      seen.add(edge.id);
      edgesMap.set(edge.id, edge);
    }

    for (const edge of edgesMap.values()) {
      if (!seen.has(edge.id)) {
        edgesMap.delete(edge.id);
      }
    }
  }, []);

  const onEdgesChange = useCallback((changes) => {
    const edges = Array.from(edgesMap.values());
    const nextEdges = applyEdgeChanges(changes, edges);

    for (const change of changes) {
      if (change.type === "add" || change.type === "replace") {
        edgesMap.set(change.item.id, change.item);
      } else if (change.type === "remove" && edgesMap.has(change.id)) {
        edgesMap.delete(change.id);
      } else {
        edgesMap.set(
          change.id,
          nextEdges.find((n) => n.id === change.id)
        );
      }
    }
  }, []);

  useEffect(() => {
    const observer = () => {
      setEdges(Array.from(edgesMap.values()));
    };

    setEdges(Array.from(edgesMap.values()));
    edgesMap.observe(observer);

    return () => edgesMap.unobserve(observer);
  }, [setEdges]);

  return [edges, setEdgesSynced, onEdgesChange];
}

export default useEdgesStateSynced;
