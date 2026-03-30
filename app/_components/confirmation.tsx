"use client";

type ConfirmModalProps = {
  show: boolean;
  handleClose: () => void;
  message: React.ReactNode;
  handleYes: () => void;
  handleNo: () => void;
};

export default function ConfirmModal({
  show,
  handleClose,
  message,
  handleYes,
  handleNo,
}: ConfirmModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-lg">
        <div className="p-5 text-sm text-zinc-700">{message}</div>
        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            onClick={handleNo}
          >
            No
          </button>
          <button
            type="button"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            onClick={handleYes}
          >
            Yes
          </button>
          <button
            type="button"
            className="ml-1 rounded-lg px-2 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
            aria-label="Close"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
