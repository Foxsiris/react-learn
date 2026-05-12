import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { I } from "./Icons";

type Toast = { msg: string; key: number };
type Ctx = { fireToast: (msg: string) => void };

const ToastCtx = createContext<Ctx>({ fireToast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const fireToast = useCallback((msg: string) => {
    const key = Date.now();
    setToast({ msg, key });
    setTimeout(() => {
      setToast((t) => (t && t.key === key ? null : t));
    }, 2400);
  }, []);

  return (
    <ToastCtx.Provider value={{ fireToast }}>
      {children}
      {toast && (
        <div className="toast" key={toast.key}>
          <span className="ico"><I.done size={16} /></span>
          {toast.msg}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
