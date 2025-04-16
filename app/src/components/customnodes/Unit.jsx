import { Handle, Position } from "@xyflow/react";

const portPositionMapping = {
  0: Position.Left,
  1: Position.Right,
  2: Position.Top,
  3: Position.Bottom,
};

function Port({ item }) {
  const side = portPositionMapping[item.sidelocation];
  return (
    <Handle
      id={item.id}
      type={item.type}
      position={side}
      style={
        side === Position.Top || side === Position.Bottom
          ? { left: `${item.position}%` }
          : { top: `${item.position}%` }
      }
      className="text-[8px]"
    >
      {item.name}
    </Handle>
  );
}

export default function Unit({ data }) {
  return (
    <div className="w-[70px] h-[70px] border flex items-center justify-center">
      <p>{data.label}</p>
      {data.handles.map((item, index) => (
        <Port key={`port ${index} of ${data.label}`} item={item} />
      ))}
    </div>
  );
}
