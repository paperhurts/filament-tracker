/*
════════════════════════════════════════════════════════════════
  INVENTORY DATA — Edit this section to update your filament stock.

  Each spool entry:
    id:           unique string
    name:         color name
    material:     "PLA" | "PETG" | "PLA Silk" | "Mystery"
    color:        hex code for display swatch
    sku:          manufacturer SKU
    spoolType:    "refill" | "spool"
    weightG:      total weight in grams (1000 = 1kg)
    remainingG:   how much is left in grams
    costPerSpool: price paid (after discounts)
    qty:          number of spools of this exact type
    notes:        optional notes

  AMS config: set which spool IDs are in slots 1-4

  Print log entries:
    date:         YYYY-MM-DD
    name:         what you printed
    url:          MakerWorld/Thingiverse link (optional)
    material:     what material you used
    materialUsed: what spool ID was used
    status:       "success" | "failed" | "reprint"
    notes:        what happened, lessons learned
    warnings:     array of material warnings, e.g. ["Do NOT print with PLA Silk"]
═══════════════════════════════════════════════════════════════════
*/
const INVENTORY_DATA = {
  lastUpdated: "2026-05-16",
  printer: "Bambu Lab P2S + AMS",

  // Which spool IDs are loaded in AMS slots 1-4 (null = empty)
  ams: ["pla-black", "pla-jade-white", "pla-cyan", "pla-red", null],

  printLog: [
    { date: "2026-04-11", name: "Mini Articulated Dragon Magnet Keychain", url: "https://makerworld.com/en/models/587584-mini-articulated-dragon-magnet-keychain", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 9.53, status: "success", notes: "Dawn Radiance silk looks great. Simpler joints than Hormagaunt — PLA Silk works at this scale/geometry.", warnings: [] },
    { date: "2026-04-11", name: "Articulated Tyranid Hormagaunt", url: "https://makerworld.com/en/models/1173257-articulated-tyranide-hormagaunt", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 110.34, status: "failed", notes: "Articulated joints snapped — PLA (and especially silk PLA) too brittle for snap-fit hinges. Needs PETG.", warnings: ["Do NOT print with PLA Silk", "Do NOT print with PLA — use PETG"] },
    { date: "2026-04-12", name: "Spiked Articulated Snake", url: "", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 35.31, status: "success", notes: "Print-in-place articulated snake. Silk finish looks good on scales.", warnings: [] },
    { date: "2026-04-12", name: "Mini Articulated Dragon Batch (full plate)", url: "https://makerworld.com/en/models/587584-mini-articulated-dragon-magnet-keychain", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 228.78, status: "success", notes: "Full build plate of dragons. ~24 dragons at ~9.5g each. Party favors / gifts.", warnings: [] },
    { date: "2026-04-13", name: "Mini Darth Vader Action Figure", url: "https://makerworld.com/en/models/2293763-new-darth-vader-mini-action-figure", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 19.09, status: "failed", notes: "SO MUCH WASTE from supports. Fingers broke off during support removal. Should have been print-in-place.", warnings: ["Do NOT print with PLA Silk — too brittle for small appendages with support removal"] },
    { date: "2026-04-14", name: "Flexi Holding Cat (x2)", url: "https://makerworld.com/en/models/584640-flexi-holding-cat-print-in-place", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 25.68, status: "success", notes: "Print-in-place, no supports. Printed 2. Swapped to black PLA after this.", warnings: [] },
    { date: "2026-04-14", name: "Tyranids Leviathan Screaming Hunter", url: "", material: "PLA", materialUsedId: "pla-black", filamentUsedG: 53.01, status: "success", notes: "0.12mm layer height, 2 walls, 8% infill. Fine detail Tyranid mini for Rob.", warnings: [] },
    { date: "2026-04-17", name: "Dummy 13 General Grievous (150%) — Plate 1 Black", url: "https://makerworld.com/en/models/1201894-dummy-13-general-grevious", material: "PLA", materialUsedId: "pla-black", filamentUsedG: 63.57, status: "reprint", notes: "Took 3 attempts — small parts lost adhesion without brims. Split into 2 custom plates by color.", warnings: ["Add brims to all parts — small pieces will spaghetti without them"] },
    { date: "2026-04-20", name: "Dummy 13 Ghostbuster 1.0", url: "", material: "PLA", materialUsedId: "pla-red", filamentUsedG: 13, status: "success", notes: "Printed in red. Quick little Dummy 13 variant.", warnings: [] },
    { date: "2026-04-21", name: "Grim Reaper Gamer Edition (3 plates)", url: "", material: "PLA", materialUsedId: "pla-black", filamentUsedG: 26, status: "success", notes: "Plate 1: A1 Black 22g (body/helmet), Plate 2: A4 Red 2g (controller), Plate 3: A2 White 2g (skull face). Multicolor assembly model.", warnings: [] },
    { date: "2026-04-22", name: "Articulated Reaper Leviathan — Subnautica", url: "https://makerworld.com/en/models/572246-articulated-reaper-leviathan-subnautica", material: "PLA", materialUsedId: "pla-jade-white", filamentUsedG: 84, status: "success", notes: "Printed in Jade White. Articulation works great in PLA at this scale.", warnings: [] },
    { date: "2026-04-22", name: "Articulated Jetragon — Palworld", url: "", material: "PLA", materialUsedId: "pla-jade-white", filamentUsedG: 72, status: "success", notes: "Printed in Jade White. Rowan's Palworld collection.", warnings: [] },
    { date: "2026-04-22", name: "Articulated Sea Emperor Leviathan — Subnautica (2 plates)", url: "", material: "PLA", materialUsedId: "pla-cyan", filamentUsedG: 127, status: "success", notes: "Plate 1: A3 Cyan 58g, Plate 2: A3 Cyan 69g. Looks amazing in cyan.", warnings: [] },
    { date: "2026-04-23", name: "Articulated Sea Dragon Leviathan — Subnautica (3 plates)", url: "", material: "PLA", materialUsedId: "pla-red", filamentUsedG: 178, status: "success", notes: "Plate 1 Body: A4 Red 53g, Plate 1: A4 Red 54g, Plate 2: A4 Red 71g. Subnautica collection complete.", warnings: [] },
    { date: "2026-04-24", name: "Flexi Skeleton Spinosaurus (25cm)", url: "", material: "PLA", materialUsedId: "pla-black", filamentUsedG: 90, status: "success", notes: "0.2mm layer, 2 walls, 5% infill. Print-in-place skeleton dino.", warnings: [] },
    { date: "2026-04-25", name: "Mid-Century Organizer (3 plates)", url: "", material: "PLA", materialUsedId: "pla-jade-white", filamentUsedG: 445, status: "success", notes: "Plate 1: A2 White 387g (15.2h!), Plate 2: A2 White 56g, Plate 3: A3 Cyan 2g (pegs). First practical/household print.", warnings: [] },
    { date: "2026-04-26", name: "Altoids Chess Set (x3)", url: "", material: "PLA", materialUsedId: "pla-jade-white", filamentUsedG: 36, status: "success", notes: "Multicolor: A2 White 8g + A1 Black 4g per set. Printed 3 copies — was a hit.", warnings: [] },
    { date: "2026-04-27", name: "Imperial Tower (3 plates)", url: "", material: "PLA", materialUsedId: "pla-black", filamentUsedG: 334, status: "success", notes: "Plate 1: A1 Black 104g, Plate 2: A1 Black 134g, Plate 3: A1 Black 96g. D&D terrain for Rob's campaign.", warnings: [] },
    { date: "2026-04-28", name: "Modular D&D Medieval Tavern & Inn Set (2 plates)", url: "", material: "PLA", materialUsedId: "pla-black", filamentUsedG: 338, status: "success", notes: "Plate 2: A1 Black 92g, Plate 1: A1 Black 246g. More D&D terrain — printing today.", warnings: [] },
  ],

  spools: [
    // ══════════════════════════════════════════════
    // PLA BASIC — REFILLS
    // ══════════════════════════════════════════════
    // Order 1
    { id: "pla-purple-r", name: "Purple", material: "PLA", color: "#7B2D8E", sku: "10700", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 1, notes: "Order 1" },
    { id: "pla-turquoise-r", name: "Turquoise", material: "PLA", color: "#40C9B0", sku: "10605", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 1, notes: "Order 1" },
    { id: "pla-yellow-r", name: "Yellow", material: "PLA", color: "#FFD700", sku: "10400", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 13.00, qty: 2, notes: "Order 1" },
    // Orders 3-5 refills
    { id: "pla-jade-white-r", name: "Jade White", material: "PLA", color: "#E8E4D9", sku: "10100", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 3, notes: "1× Order 3, 2× Order 5" },
    { id: "pla-black-r", name: "Black", material: "PLA", color: "#1a1a1a", sku: "10101", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 2, notes: "Order 5" },
    { id: "pla-maroon-red-r", name: "Maroon Red", material: "PLA", color: "#800020", sku: "10205", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 1, notes: "Order 3" },
    { id: "pla-brown-r", name: "Brown", material: "PLA", color: "#6D4C30", sku: "10800", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 1, notes: "Order 3" },
    { id: "pla-beige-r", name: "Beige", material: "PLA", color: "#D4C5A9", sku: "10201", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 3, notes: "1× Order 3, 2× Order 5" },
    { id: "pla-bronze-r", name: "Bronze", material: "PLA", color: "#8B6914", sku: "10801", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 13.99, qty: 1, notes: "Order 4" },
    { id: "pla-silver-r", name: "Silver", material: "PLA", color: "#A8A9AD", sku: "10102", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 13.99, qty: 1, notes: "Order 4" },
    { id: "pla-blue-grey-r", name: "Blue Grey", material: "PLA", color: "#7A8B99", sku: "10602", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 13.99, qty: 1, notes: "Order 4" },
    { id: "pla-pink-r", name: "Pink", material: "PLA", color: "#F48FB1", sku: "10203", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 13.99, qty: 1, notes: "Order 4" },
    { id: "pla-cobalt-blue-r", name: "Cobalt Blue", material: "PLA", color: "#0047AB", sku: "10604", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 13.99, qty: 2, notes: "Order 4" },
    { id: "pla-bright-green-r", name: "Bright Green", material: "PLA", color: "#39B54A", sku: "10503", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 1, notes: "Order 5" },
    { id: "pla-pumpkin-orange-r", name: "Pumpkin Orange", material: "PLA", color: "#E8751A", sku: "10301", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 2, notes: "Order 5" },

    // ══════════════════════════════════════════════
    // PLA BASIC — SPOOLS
    // ══════════════════════════════════════════════
    { id: "pla-jade-white-s", name: "Jade White", material: "PLA", color: "#E8E4D9", sku: "10100", spoolType: "spool", weightG: 1000, remainingG: 375, costPerSpool: 14.94, qty: 3, notes: "3× spool (Orders 1+2). 1st ~375g remain. ⚠ Remaining is stale — print log behind." },
    { id: "pla-black-s", name: "Black", material: "PLA", color: "#1a1a1a", sku: "10101", spoolType: "spool", weightG: 1000, remainingG: 87, costPerSpool: 14.94, qty: 4, notes: "4× spool (Orders 1+2+3). 1st ~87g/empty. ⚠ Remaining is stale." },
    { id: "pla-bambu-green-s", name: "Bambu Green", material: "PLA", color: "#00A651", sku: "10501", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.95, qty: 2, notes: "Order 1" },
    { id: "pla-cyan-s", name: "Cyan", material: "PLA", color: "#00BCD4", sku: "10603", spoolType: "spool", weightG: 1000, remainingG: 871, costPerSpool: 14.95, qty: 2, notes: "Order 1. 1st ~871g. ⚠ Remaining is stale." },
    { id: "pla-red-s", name: "Red", material: "PLA", color: "#D32F2F", sku: "10200", spoolType: "spool", weightG: 1000, remainingG: 807, costPerSpool: 14.95, qty: 2, notes: "Order 1. 1st ~807g. ⚠ Remaining is stale." },
    { id: "pla-pumpkin-orange-s", name: "Pumpkin Orange", material: "PLA", color: "#E8751A", sku: "10301", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "Order 2" },
    { id: "pla-indigo-purple-s", name: "Indigo Purple", material: "PLA", color: "#4B0082", sku: "10701", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "Order 3" },
    { id: "pla-gray-s", name: "Gray", material: "PLA", color: "#808080", sku: "10103", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 4, notes: "1× Order 3, 3× Order 5" },
    { id: "pla-mistletoe-green-s", name: "Mistletoe Green", material: "PLA", color: "#2E6B4F", sku: "10502", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "Order 3" },
    { id: "pla-cocoa-brown-s", name: "Cocoa Brown", material: "PLA", color: "#5C3317", sku: "10802", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 2, notes: "1× Order 3, 1× Order 5" },
    { id: "pla-sunflower-yellow-s", name: "Sunflower Yellow", material: "PLA", color: "#FFB300", sku: "10402", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 16.09, qty: 1, notes: "Order 4" },

    // ══════════════════════════════════════════════
    // PLA TRANSLUCENT
    // ══════════════════════════════════════════════
    { id: "pla-trans-light-jade", name: "Light Jade", material: "PLA Translucent", color: "#A8E6CF", sku: "13510", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "Order 3. For D&D kit + lamp projects." },

    // ══════════════════════════════════════════════
    // PLA GLOW
    // ══════════════════════════════════════════════
    { id: "pla-glow-green", name: "Glow Green", material: "PLA Glow", color: "#76FF7A", sku: "15500", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 24.99, qty: 1, notes: "Order 4. External spool only — NOT AMS compatible. For D&D kit." },

    // ══════════════════════════════════════════════
    // PLA SILK
    // ══════════════════════════════════════════════
    { id: "pla-silk-dawn", name: "Dawn Radiance", material: "PLA Silk", color: "linear-gradient(135deg, #F4A460, #DAA520, #E8C07A, #CD853F)", sku: "13912", spoolType: "spool", weightG: 1000, remainingG: 571, costPerSpool: 24.99, qty: 1, notes: "Multi-color silk. ⚠ Remaining is stale." },

    // ══════════════════════════════════════════════
    // PETG
    // ══════════════════════════════════════════════
    { id: "petg-white", name: "White", material: "PETG", color: "#F0F0F0", sku: "30106", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "" },
    { id: "petg-black", name: "Black", material: "PETG", color: "#1a1a1a", sku: "30105", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "" },
    { id: "petg-blue", name: "Reflex Blue", material: "PETG", color: "#1939B7", sku: "30603", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "" },
    { id: "petg-yellow", name: "Yellow", material: "PETG", color: "#FFC107", sku: "30402", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "" },
    { id: "petg-red", name: "Red", material: "PETG", color: "#C62828", sku: "30201", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "" },
    { id: "petg-clear", name: "Clear", material: "PETG", color: "#c8ddf0", sku: "32101", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "Order 2. Translucent — for lamp/light projects." },

    // ══════════════════════════════════════════════
    // MYSTERY BOX
    // ══════════════════════════════════════════════
    { id: "mystery-laser", name: "Laser Mystery Box", material: "Mystery", color: "linear-gradient(135deg, #a371f7, #58a6ff, #a371f7)", sku: "mystery", spoolType: "spool", weightG: 0, remainingG: 0, costPerSpool: 39.99, qty: 1, notes: "Plywood/Acrylic/PU/Metal — contents TBD" },
  ]
};
