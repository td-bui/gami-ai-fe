type Props = {
  onMouseDown: () => void;
};
export default function VSCodeVerticalDivider({ onMouseDown }: Props) {
  return (
    <div
      className="relative h-full flex flex-col items-center justify-center group"
      style={{
        width: "8px",
        minWidth: "8px",
        cursor: "col-resize",
        userSelect: "none",
        zIndex: 20,
        background: "transparent",
      }}
      onMouseDown={onMouseDown}
      title="Drag to resize"
    >
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-[2px] bg-gray-300 group-hover:bg-lamaPurple transition-colors"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-16 mt-auto mb-auto">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mb-1" />
        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mb-1" />
        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      </div>
    </div>
  );
}