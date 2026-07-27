import React, { createContext, useContext, useState, ReactNode } from "react";

export type CollectedVoucher = {
  code: string;
  label: string;
  discountDesc?: string;
};

type VoucherContextType = {
  collectedVouchers: CollectedVoucher[];
  addVoucher: (code: string, label: string, discountDesc?: string) => void;
  removeVoucher: (code: string) => void;
};

const VoucherContext = createContext<VoucherContextType>({
  collectedVouchers: [],
  addVoucher: () => {},
  removeVoucher: () => {},
});

export function VoucherProvider({ children }: { children: ReactNode }) {
  const [collectedVouchers, setCollectedVouchers] = useState<CollectedVoucher[]>([
    { code: "PLANT10", label: "Voucher 10% OFF", discountDesc: "Giảm 10% đơn hàng" }
  ]);

  const addVoucher = (code: string, label: string, discountDesc?: string) => {
    setCollectedVouchers((prev) => {
      if (prev.some((v) => v.code === code)) return prev;
      return [...prev, { code, label, discountDesc }];
    });
  };

  const removeVoucher = (code: string) => {
    setCollectedVouchers((prev) => prev.filter((v) => v.code !== code));
  };

  return (
    <VoucherContext.Provider value={{ collectedVouchers, addVoucher, removeVoucher }}>
      {children}
    </VoucherContext.Provider>
  );
}

export const useVoucher = () => useContext(VoucherContext);
