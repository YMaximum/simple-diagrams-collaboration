"use client";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Panel,
  ReactFlowProvider,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useCallback, useContext, useEffect, useRef } from "react";
import Unit from "./customnodes/Unit";

import { UserContext } from "./context/UserContext";
import useNodesStateSynced from "@/hooks/useNodesStateSynced";
import useEdgesStateSynced from "@/hooks/useEdgeStateSynced";
import Cursors from "./Cursors";
import useCursorStateSynced from "@/hooks/useCursorStateSynced";
import { setupCollaboration } from "@/providers/CustomYJSProvider";
import * as Y from "yjs";

const proOptions = {
  account: "paid-pro",
  hideAttribution: true,
};

const onDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
};

const nodeTypes = { unit: Unit };

function Canvas() {
  let { setSocket, roomId, isRoomJoined } = useContext(UserContext);

  const [nodes, setNodes, onNodesChange] = useNodesStateSynced();
  const [edges, setEdges, onEdgesChange] = useEdgesStateSynced();
  // const [cursors, onMouseMove] = useCursorStateSynced();

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const { provider } = setupCollaboration(roomId);

    setSocket((prevSocket) => ({
      ...prevSocket,
      collab: provider.getSocket(),
    }));

    return () => {
      provider.destroy();
    };
  }, [isRoomJoined]);

  const onConnect = useCallback(
    (params) => {
      setEdges((prev) => addEdge(params, prev));
    },
    [setEdges]
  );

  const onDrop = (event) => {
    event.preventDefault();

    const type = event.dataTransfer.getData("application/reactflow");
    const position = screenToFlowPosition({
      x: event.clientX - 80,
      y: event.clientY - 20,
    });
    const newNode = {
      id: `${Date.now()}`,
      type,
      position,
      data: { label: `${type}` },
    };

    setNodes((prev) => [...prev, newNode]);
  };

  // We are adding a blink effect on click that we remove after 3000ms again.
  // This should help users to see that a node was clicked by another user.
  const onNodeClick = useCallback(
    (_, clicked) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === clicked.id ? { ...node, className: "blink" } : node
        )
      );

      window.setTimeout(() => {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === clicked.id ? { ...node, className: undefined } : node
          )
        );
      }, 3000);
    },
    [setNodes]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        // onPointerMove={onMouseMove}
        proOptions={proOptions}
        fitView
      >
        {/* <Controls /> */}
        <MiniMap pannable zoomable />
        {/* <Cursors cursors={cursors} /> */}
        <Panel position="top-left">Socket.IO + Yjs</Panel>
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default function Flow() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
