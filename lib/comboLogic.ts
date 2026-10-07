import { CartItem } from "@/hooks/useCart"

export function calculateComboDiscount(items: CartItem[], combos: any[]): { discount: number; appliedCombo: any | null } {
  if (!combos || combos.length === 0) return { discount: 0, appliedCombo: null };
  
  // Use the combo that gives the highest discount
  let bestDiscount = 0;
  let appliedCombo = null;

  for (const combo of combos) {
    const requiredTotalQty = combo.buy_quantity + combo.get_quantity;
    const eligibleItems = items.filter(item => item.tags?.includes(`combo:${combo.id}`));
    let totalQty = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalQty >= requiredTotalQty) {
      const times = Math.floor(totalQty / requiredTotalQty);
      const freeItemsCount = times * combo.get_quantity;
      
      let allUnits: number[] = [];
      eligibleItems.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          allUnits.push(item.price);
        }
      });
      allUnits.sort((a, b) => a - b);
      
      let discount = 0;
      for (let i = 0; i < freeItemsCount && i < allUnits.length; i++) {
        discount += allUnits[i];
      }

      if (discount > bestDiscount) {
        bestDiscount = discount;
        appliedCombo = combo;
      }
    }
  }

  return { discount: bestDiscount, appliedCombo };
}
