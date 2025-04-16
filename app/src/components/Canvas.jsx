"use client";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useCallback, useContext, useEffect, useRef } from "react";
import Unit from "./customnodes/Unit";
import { initialNodes } from "@/data/nodes";
import { initialEdges } from "@/data/edges";

import * as Y from "yjs";
import { encodeStateAsUpdate, applyUpdate } from "y-protocols/sync";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";

import { io } from "socket.io-client";
import { UserContext } from "./context/UserContext";

const nodeTypes = { unit: Unit };

export default function Canvas() {
  let { socket, setSocket, sessionId, username } = useContext(UserContext);
  const ydocRef = useRef < Y.Doc > new Y.Doc();
  const awarenessRef = useRef < Awareness > new Awareness(ydocRef.current);
  const yNodes = ydocRef.current.getArray("nodes");
  const yEdges = ydocRef.current.getArray("edges");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const newSocket = io(
      process.env.NEXT_PUBLIC_WEBSOCKET_URL
        ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/collab`
        : "http://localhost:3001/collab"
    );

    newSocket.emit("join-session", { sessionId, username });

    // Handle sync from server
    newSocket.on("sync", (update) => {
      applyUpdate(ydocRef.current, update);
    });

    newSocket.on("awareness-update", (update) => {
      applyAwarenessUpdate(awarenessRef.current, update, newSocket.id);
    });

    // Emit awareness state
    awarenessRef.current.setLocalStateField("user", { name: username });

    awarenessRef.current.on("update", ({ added, updated, removed }) => {
      const changedClients = added.concat(updated).concat(removed);
      const update = encodeAwarenessUpdate(
        awarenessRef.current,
        changedClients
      );
      newSocket.emit("awareness-update", { sessionId, update });
    });

    // Initial sync
    const initialUpdate = encodeStateAsUpdate(ydocRef.current);
    newSocket.emit("sync", { sessionId, update: initialUpdate });

    setSocket({ ...socket, collab: newSocket });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Yjs → React
  useEffect(() => {
    const updateNodes = () => setNodes(yNodes.toArray());
    const updateEdges = () => setEdges(yEdges.toArray());

    yNodes.observe(updateNodes);
    yEdges.observe(updateEdges);

    if (yNodes.length === 0) yNodes.push(initialNodes);
    if (yEdges.length === 0) yEdges.push(initialEdges);
    else {
      updateNodes();
      updateEdges();
    }

    return () => {
      yNodes.unobserve(updateNodes);
      yEdges.unobserve(updateEdges);
    };
  }, []);

  // React → Yjs
  const handleNodesChange = useCallback(
    (changes) => {
      const updated = applyNodeChanges(changes, yNodes.toArray());
      yNodes.delete(0, yNodes.length);
      yNodes.push(updated);
    },
    [setNodes]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      const updated = applyEdgeChanges(changes, yEdges.toArray());
      yEdges.delete(0, yEdges.length);
      yEdges.push(updated);
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (params) => {
      const updated = addEdge(params, yEdges.toArray());
      yEdges.delete(0, yEdges.length);
      yEdges.push(updated);
    },
    [setEdges]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap pannable zoomable />
        <Panel position="top-left">Socket.IO + Yjs</Panel>
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
