"use client";
import React, { useState, useRef, useCallback } from "react";
import ForceGraph from "react-force-graph-2d";
import { transformData } from "@/utils/utils";
import flattedData from "../data/flatted_data.json";

const kindColors = {
  refinery: "#ff6b6b",
  tanker: "#4ecdc4",
  company: "#45b7d1",
  trunkline: "#96ceb4",
  field: "#ffeaa7",
  "truck - tank": "#dda0dd",
  county: "#fdcb6e",
  country: "#e17055",
};

const ForceGraphVisualization = () => {
  const fgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  console.log(flattedData);
  const [graphData, setGraphData] = useState(() =>
    transformData(flattedData.nodes, flattedData.edges)
  );

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleNodeRightClick = useCallback((node) => {
    // Focus on node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(8, 2000);
    }
  }, []);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.name;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    // Get color based on kind
    const nodeColor = kindColors[node.kind] || "#69b3a2";

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = nodeColor;
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw label
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = "#333";
    ctx.fillText(label, node.x - textWidth / 2, node.y + fontSize / 2 + 8);

    // Add kind indicator
    ctx.font = `${fontSize * 0.8}px Sans-Serif`;
    ctx.fillStyle = "#666";
    const kindWidth = ctx.measureText(node.kind).width;
    ctx.fillText(node.kind, node.x - kindWidth / 2, node.y + fontSize + 18);
  }, []);

  const linkCanvasObject = useCallback((link, ctx) => {
    const MAX_FONT_SIZE = 4;
    const LABEL_NODE_MARGIN = 6;

    const start = link.source;
    const end = link.target;

    // Ignore unbound links
    if (typeof start !== "object" || typeof end !== "object") return;

    // Draw link line
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Draw arrow
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const arrowLength = 8;

    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(
      end.x - arrowLength * Math.cos(angle - Math.PI / 6),
      end.y - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(end.x, end.y);
    ctx.lineTo(
      end.x - arrowLength * Math.cos(angle + Math.PI / 6),
      end.y - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }, []);

  const innerWidth = window.innerWidth;
  const innerHeight = window.innerHeight;

  return (
    <div className="w-full h-screen bg-gray-100">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Network Visualization</h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Legend</h3>
            <div className="space-y-2">
              {Object.entries(kindColors).map(([kind, color]) => (
                <div key={kind} className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-sm">{kind}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Statistics</h3>
            <div className="text-sm space-y-1">
              <div>Nodes: {graphData.nodes.length}</div>
              <div>Links: {graphData.links.length}</div>
            </div>
          </div>

          {selectedNode && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Selected Node</h3>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium">{selectedNode.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Type: {selectedNode.kind}
                </div>
                {selectedNode.handles && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Handles:</div>
                    {selectedNode.handles.map((handle) => (
                      <div
                        key={handle.id}
                        className="text-xs text-gray-600 ml-2"
                      >
                        {handle.name} ({handle.type})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <div className="mb-2">
              <strong>Controls:</strong>
            </div>
            <div>• Click node to select</div>
            <div>• Right-click to focus</div>
            <div>• Drag to pan</div>
            <div>• Scroll to zoom</div>
          </div>
        </div>

        {/* Main graph area */}
        <div className="flex-1">
          <ForceGraph
            ref={fgRef}
            graphData={graphData}
            nodeCanvasObject={nodeCanvasObject}
            linkCanvasObject={linkCanvasObject}
            onNodeClick={handleNodeClick}
            onNodeRightClick={handleNodeRightClick}
            nodePointerAreaPaint={(node, color, ctx) => {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
              ctx.fill();
            }}
            linkDirectionalArrowLength={0}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            minZoom={0.1}
            maxZoom={20}
            cooldownTicks={100}
            d3AlphaDecay={0.0228}
            d3VelocityDecay={0.4}
            linkColor={() => "#999"}
            backgroundColor="#f8f9fa"
            width={innerWidth - 320}
            height={innerHeight}
          />
        </div>
      </div>
    </div>
  );
};

export default ForceGraphVisualization;
