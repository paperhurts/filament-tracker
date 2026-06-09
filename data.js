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
    rfidColor:    hex reported by Bambu AMS RFID (exact match key for auto-sync)
    emptied:      count of fully-consumed units (kept so Invested = total ever spent)

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
    taskIds:      Bambu Cloud task ids covered by this entry (dedup key for auto-sync)
═══════════════════════════════════════════════════════════════════
*/
const INVENTORY_DATA = {
  lastUpdated: "2026-06-09",
  printer: "Bambu Lab P2S + AMS",

  // Which spool IDs are loaded in AMS slots 1-4 (null = empty)
  ams: ["pla-yellow-r", "pla-cyan-s", "pla-black-r", "pla-indigo-purple-s", null],

  printLog: [
    { date: "2026-04-11", name: "Mini Articulated Dragon Magnet Keychain", url: "https://makerworld.com/en/models/587584-mini-articulated-dragon-magnet-keychain", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 9.53, status: "success", notes: "Dawn Radiance silk looks great. Simpler joints than Hormagaunt — PLA Silk works at this scale/geometry.", warnings: [] },
    { date: "2026-04-11", name: "Articulated Tyranid Hormagaunt", url: "https://makerworld.com/en/models/1173257-articulated-tyranide-hormagaunt", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 110.34, status: "failed", notes: "Articulated joints snapped — PLA (and especially silk PLA) too brittle for snap-fit hinges. Needs PETG.", warnings: ["Do NOT print with PLA Silk", "Do NOT print with PLA — use PETG"] },
    { date: "2026-04-12", name: "Spiked Articulated Snake", url: "", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 35.31, status: "success", notes: "Print-in-place articulated snake. Silk finish looks good on scales.", warnings: [] },
    { date: "2026-04-12", name: "Mini Articulated Dragon Batch (full plate)", url: "https://makerworld.com/en/models/587584-mini-articulated-dragon-magnet-keychain", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 228.78, status: "success", notes: "Full build plate of dragons. ~24 dragons at ~9.5g each. Party favors / gifts.", warnings: [] },
    { date: "2026-04-13", name: "Mini Darth Vader Action Figure", url: "https://makerworld.com/en/models/2293763-new-darth-vader-mini-action-figure", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 19.09, status: "failed", notes: "SO MUCH WASTE from supports. Fingers broke off during support removal. Should have been print-in-place.", warnings: ["Do NOT print with PLA Silk — too brittle for small appendages with support removal"] },
    { date: "2026-04-14", name: "Flexi Holding Cat (x2)", url: "https://makerworld.com/en/models/584640-flexi-holding-cat-print-in-place", material: "PLA Silk", materialUsedId: "pla-silk-dawn", filamentUsedG: 25.68, status: "success", notes: "Print-in-place, no supports. Printed 2. Swapped to black PLA after this.", warnings: [] },
    { date: "2026-04-14", name: "Tyranids Leviathan Screaming Hunter", url: "", material: "PLA", materialUsedId: "pla-black-s", filamentUsedG: 53.01, status: "success", notes: "0.12mm layer height, 2 walls, 8% infill. Fine detail Tyranid mini for Rob.", warnings: [] },
    { date: "2026-04-17", name: "Dummy 13 General Grievous (150%) — Plate 1 Black", url: "https://makerworld.com/en/models/1201894-dummy-13-general-grevious", material: "PLA", materialUsedId: "pla-black-s", filamentUsedG: 63.57, status: "reprint", notes: "Took 3 attempts — small parts lost adhesion without brims. Split into 2 custom plates by color.", warnings: ["Add brims to all parts — small pieces will spaghetti without them"] },
    { date: "2026-04-20", name: "Dummy 13 Ghostbuster 1.0", url: "", material: "PLA", materialUsedId: "pla-red-s", filamentUsedG: 13, status: "success", notes: "Printed in red. Quick little Dummy 13 variant.", warnings: [] },
    { date: "2026-04-21", name: "Grim Reaper Gamer Edition (3 plates)", url: "", material: "PLA", materialUsedId: "pla-black-s", filamentUsedG: 26, status: "success", notes: "Plate 1: A1 Black 22g (body/helmet), Plate 2: A4 Red 2g (controller), Plate 3: A2 White 2g (skull face). Multicolor assembly model.", warnings: [] },
    { date: "2026-04-22", name: "Articulated Reaper Leviathan — Subnautica", url: "https://makerworld.com/en/models/572246-articulated-reaper-leviathan-subnautica", material: "PLA", materialUsedId: "pla-jade-white-s", filamentUsedG: 84, status: "success", notes: "Printed in Jade White. Articulation works great in PLA at this scale.", warnings: [] },
    { date: "2026-04-22", name: "Articulated Jetragon — Palworld", url: "", material: "PLA", materialUsedId: "pla-jade-white-s", filamentUsedG: 72, status: "success", notes: "Printed in Jade White. Rowan's Palworld collection.", warnings: [] },
    { date: "2026-04-22", name: "Articulated Sea Emperor Leviathan — Subnautica (2 plates)", url: "", material: "PLA", materialUsedId: "pla-cyan-s", filamentUsedG: 127, status: "success", notes: "Plate 1: A3 Cyan 58g, Plate 2: A3 Cyan 69g. Looks amazing in cyan.", warnings: [] },
    { date: "2026-04-23", name: "Articulated Sea Dragon Leviathan — Subnautica (3 plates)", url: "", material: "PLA", materialUsedId: "pla-red-s", filamentUsedG: 178, status: "success", notes: "Plate 1 Body: A4 Red 53g, Plate 1: A4 Red 54g, Plate 2: A4 Red 71g. Subnautica collection complete.", warnings: [] },
    { date: "2026-04-24", name: "Flexi Skeleton Spinosaurus (25cm)", url: "", material: "PLA", materialUsedId: "pla-black-s", filamentUsedG: 90, status: "success", notes: "0.2mm layer, 2 walls, 5% infill. Print-in-place skeleton dino.", warnings: [] },
    { date: "2026-04-25", name: "Mid-Century Organizer (3 plates)", url: "", material: "PLA", materialUsedId: "pla-jade-white-s", filamentUsedG: 445, status: "success", notes: "Plate 1: A2 White 387g (15.2h!), Plate 2: A2 White 56g, Plate 3: A3 Cyan 2g (pegs). First practical/household print.", warnings: [] },
    { date: "2026-04-26", name: "Altoids Chess Set (x3)", url: "", material: "PLA", materialUsedId: "pla-jade-white-s", filamentUsedG: 36, status: "success", notes: "Multicolor: A2 White 8g + A1 Black 4g per set. Printed 3 copies — was a hit.", warnings: [] },
    { date: "2026-04-27", name: "Imperial Tower (3 plates)", url: "", material: "PLA", materialUsedId: "pla-black-s", filamentUsedG: 334, status: "success", notes: "Plate 1: A1 Black 104g, Plate 2: A1 Black 134g, Plate 3: A1 Black 96g. D&D terrain for Rob's campaign.", warnings: [] },
    { date: "2026-04-28", name: "Modular D&D Medieval Tavern & Inn Set (2 plates)", url: "", material: "PLA", materialUsedId: "pla-black-s", filamentUsedG: 338, status: "success", notes: "Plate 2: A1 Black 92g, Plate 1: A1 Black 246g. More D&D terrain — printing today.", warnings: [] },
    { date: "2026-04-18", name: "Dummy 13 - General Grevious", url: "https://makerworld.com/en/models/1201894", material: "PLA", materialUsedId: "pla-jade-white-s", filamentUsedG: 47.18, status: "success", notes: "", warnings: [], taskIds: [888150381] },
    { date: "2026-04-19", name: "Halloween Cat Mini Figures – Set of 6", url: "https://makerworld.com/en/models/1826373", material: "PLA", materialUsedId: "pla-jade-white-s", filamentUsedG: 49.64, status: "success", notes: "", warnings: [], taskIds: [889021887] },
    { date: "2026-04-29", name: "Infinite Cube", url: "https://makerworld.com/en/models/909738", material: "PLA", materialUsedId: "pla-black-s", filamentUsedG: 23.36, status: "success", notes: "", warnings: [], taskIds: [914227875] },
    { date: "2026-04-30", name: "Mini Barn – 3D Printed Storage for Tiny Animals", url: "https://makerworld.com/en/models/1232063", material: "PLA", materialUsedId: "pla-red-s", filamentUsedG: 83.08, status: "success", notes: "3 plates. Colors: Red 60.2g, Black 14.1g, White 8.8g.", warnings: [], taskIds: [915581497, 915825996, 916023420] },
    { date: "2026-04-30", name: "Gift Box with lid", url: "https://makerworld.com/en/models/60983", material: "PLA", materialUsedId: "pla-jade-white-s", filamentUsedG: 49.81, status: "success", notes: "2 plates. Colors: White 40.7g, Red 9.1g.", warnings: [], taskIds: [916162380, 916340274] },
    { date: "2026-05-01", name: "Pocket doll house", url: "https://makerworld.com/en/models/985301", material: "PLA", materialUsedId: "pla-jade-white-s", filamentUsedG: 136.83, status: "success", notes: "", warnings: [], taskIds: [918212432] },
    { date: "2026-05-02", name: "Bambu Bed Scraper", url: "https://makerworld.com/en/models/12703", material: "PLA", materialUsedId: "pla-jade-white-r", filamentUsedG: 3.06, status: "success", notes: "", warnings: [], taskIds: [918908528] },
    { date: "2026-05-02", name: "Holder for Post-It Notes - Stencils Included — cancelled plate", url: "https://makerworld.com/en/models/931302", material: "PLA", materialUsedId: "pla-jade-white-r", filamentUsedG: 199.76, status: "failed", notes: "Cancelled mid-print.", warnings: [], taskIds: [918988798] },
    { date: "2026-05-03", name: "Holder for Post-It Notes - Stencils Included", url: "https://makerworld.com/en/models/931302", material: "PLA", materialUsedId: "pla-jade-white-r", filamentUsedG: 314.79, status: "success", notes: "Printed 2026-05-02 → 2026-05-03. 2 plates.", warnings: [], taskIds: [920317185, 923459684] },
    { date: "2026-05-07", name: "Peacock Floral Vase Deep Blue Elegant Home Decor", url: "https://makerworld.com/en/models/2557716", material: "PLA", materialUsedId: "pla-cyan-s", filamentUsedG: 86.31, status: "success", notes: "", warnings: [], taskIds: [932760823] },
    { date: "2026-05-08", name: "Box with Lid Mini Slide Box ", url: "https://makerworld.com/en/models/198150", material: "PLA", materialUsedId: "pla-cyan-s", filamentUsedG: 37.48, status: "success", notes: "", warnings: [], taskIds: [933358757] },
    { date: "2026-05-08", name: "Base + Top", url: "", material: "PLA", materialUsedId: "pla-jade-white-r", filamentUsedG: 178.29, status: "success", notes: "", warnings: [], taskIds: [934309163] },
    { date: "2026-05-09", name: "Customizable Snap-Lock Box (Parametric)", url: "https://makerworld.com/en/models/1766347", material: "PLA", materialUsedId: "pla-jade-white-r", filamentUsedG: 110.12, status: "success", notes: "Colors: White 61.8g, Cyan 41.7g, Red 6.7g.", warnings: [], taskIds: [935409805] },
    { date: "2026-05-09", name: "SnapLock V3", url: "https://makerworld.com/en/models/2168356", material: "PLA", materialUsedId: "pla-cyan-s", filamentUsedG: 216.84, status: "success", notes: "4 plates. Colors: Cyan 122.1g, White 84.9g, Red 9.8g.", warnings: [], taskIds: [936321037, 936586370, 937377407, 937653535] },
    { date: "2026-05-10", name: "Ultimate DND Players Kit - v3 -Lockable, Tracking", url: "https://makerworld.com/en/models/2019312", material: "PLA", materialUsedId: "pla-black-r", filamentUsedG: 748.86, status: "success", notes: "Printed 2026-05-03 → 2026-05-10. 11 plates. Colors: Black 687.3g, White 61.5g.", warnings: [], taskIds: [922393677, 922600025, 924416564, 925980007, 927947459, 929216390, 929898574, 930512482, 931872997, 932624406, 938996468] },
    { date: "2026-05-11", name: "Parthenon Tissue Box", url: "https://makerworld.com/en/models/1790835", material: "PLA", materialUsedId: "pla-jade-white-r", filamentUsedG: 388.54, status: "success", notes: "Printed 2026-05-10 → 2026-05-11. 5 plates. Colors: White 366.5g, PETG Clear 22.1g.", warnings: [], taskIds: [939635963, 940220241, 941206479, 941409362, 942382516] },
    { date: "2026-05-11", name: "Parthenon Tissue Box — cancelled plate", url: "https://makerworld.com/en/models/1790835", material: "PETG", materialUsedId: "petg-clear", filamentUsedG: 22.06, status: "failed", notes: "Cancelled mid-print.", warnings: [], taskIds: [942144382] },
    { date: "2026-05-16", name: "Vintage Sports Cooler Soda Can Mugger — cancelled plate", url: "https://makerworld.com/en/models/2740236", material: "PLA", materialUsedId: "pla-pumpkin-orange-s", filamentUsedG: 264.42, status: "failed", notes: "Cancelled mid-print.", warnings: [], taskIds: [952383070] },
    { date: "2026-05-20", name: "Deluxe Ocarina - Fully Playable", url: "https://makerworld.com/en/models/1249288", material: "PLA", materialUsedId: "pla-cyan-s", filamentUsedG: 73.87, status: "success", notes: "", warnings: [], taskIds: [963909621] },
    { date: "2026-05-21", name: "Vintage Sports Cooler Soda Can Mugger", url: "https://makerworld.com/en/models/2740236", material: "PLA", materialUsedId: "pla-pumpkin-orange-r", filamentUsedG: 1542.76, status: "success", notes: "Printed 2026-05-12 → 2026-05-21. 7 plates. Colors: Pumpkin Orange 1204.7g, White 266.4g, Cyan 71.7g.", warnings: [], taskIds: [943989106, 944638515, 946037559, 947530073, 948450800, 951536609, 965124755] },
    { date: "2026-05-22", name: "树屋花园  — cancelled plate", url: "https://makerworld.com/en/models/2271554", material: "PLA", materialUsedId: "pla-bronze-r", filamentUsedG: 51.46, status: "failed", notes: "Cancelled mid-print.", warnings: [], taskIds: [967272352] },
    { date: "2026-05-23", name: "树屋花园 ", url: "https://makerworld.com/en/models/2271554", material: "PLA", materialUsedId: "pla-bronze-r", filamentUsedG: 353.5, status: "success", notes: "Printed 2026-05-21 → 2026-05-23. 5 plates. Colors: Bronze 156.0g, Brown 144.7g, Mistletoe Green 52.8g.", warnings: [], taskIds: [966243103, 967440612, 968320715, 968801895, 969703031] },
    { date: "2026-05-23", name: "海虾号 Shrimp Ship — Subnautica (swappable arms) — cancelled plate", url: "https://makerworld.com/en/models/1896098", material: "PLA", materialUsedId: "pla-bronze-r", filamentUsedG: 70.79, status: "failed", notes: "Cancelled mid-print.", warnings: [], taskIds: [970254360] },
    { date: "2026-05-24", name: "Cute Articulated Collector Leviathan (Subnautica2)", url: "https://makerworld.com/en/models/2830510", material: "PLA", materialUsedId: "pla-turquoise-r", filamentUsedG: 259.89, status: "success", notes: "Colors: Turquoise 177.3g, Indigo Purple 39.6g, Yellow 31.4g, Black 11.5g.", warnings: [], taskIds: [971110790] },
    { date: "2026-05-24", name: "Collapsible Stack Organizer", url: "https://makerworld.com/en/models/953502", material: "PLA", materialUsedId: "pla-turquoise-r", filamentUsedG: 107.93, status: "success", notes: "", warnings: [], taskIds: [972655409] },
    { date: "2026-05-27", name: "Stackable Storage Baskets (可堆叠收纳筐)", url: "https://makerworld.com/en/models/2715207", material: "PLA", materialUsedId: "pla-turquoise-r", filamentUsedG: 723.41, status: "success", notes: "Printed 2026-05-25 → 2026-05-27. 4 plates. Colors: Turquoise 373.1g, Indigo Purple 175.2g, Yellow 175.2g.", warnings: [], taskIds: [973314388, 974206184, 975373075, 979677391] },
    { date: "2026-05-27", name: "Flexible Armrest Organizer (HSW)", url: "https://makerworld.com/en/models/926221", material: "PLA", materialUsedId: "pla-turquoise-r", filamentUsedG: 62.49, status: "success", notes: "", warnings: [], taskIds: [977932581] },
    { date: "2026-05-30", name: "Zen Fountian", url: "https://makerworld.com/en/models/1388090", material: "PLA", materialUsedId: "pla-indigo-purple-s", filamentUsedG: 604.88, status: "success", notes: "3 plates. Colors: Indigo Purple 238.1g, Yellow 184.7g, Turquoise 182.1g.", warnings: [], taskIds: [984957735, 986111139, 986694385] },
    { date: "2026-05-31", name: "Eco Filament Poop Bin - X1C, P1P, P1S, P2S and X2D", url: "https://makerworld.com/en/models/714868", material: "PLA", materialUsedId: "pla-black-r", filamentUsedG: 221.52, status: "success", notes: "", warnings: [], taskIds: [988089591] },
    { date: "2026-06-07", name: "Dice Tower Castle Stairs", url: "https://makerworld.com/en/models/509299", material: "PLA", materialUsedId: "pla-black-r", filamentUsedG: 157.23, status: "success", notes: "Came out awesome.", warnings: [], taskIds: [1004038993] },
    { date: "2026-06-08", name: "Zombicide Tile Edge System V2 - Reworked & Fixes", url: "https://makerworld.com/en/models/2689537", material: "PLA", materialUsedId: "pla-black-r", filamentUsedG: 304.27, status: "success", notes: "Printed 2026-06-07 → 2026-06-08. 4 plates. Colors: Black 195.3g, Yellow 109.0g. Ran out of black mid-job — swapped to the sealed refill.", warnings: [], taskIds: [1005546548, 1006611640, 1007379899, 1007998853] },
    { date: "2026-06-08", name: "Zombicide Tile Edge System V2 — cancelled plate", url: "https://makerworld.com/en/models/2689537", material: "PLA", materialUsedId: "pla-black-r", filamentUsedG: 0, status: "failed", notes: "Cancelled right after start: ran out of black, swapped refill, restarted (filament swaps always cause issues — barely any filament used).", warnings: [], taskIds: [1006810083] },
  ],

  spools: [
    // ══════════════════════════════════════════════
    // PLA BASIC — REFILLS
    // ══════════════════════════════════════════════
    // Order 1
    { id: "pla-purple-r", name: "Purple", material: "PLA", color: "#7B2D8E", sku: "10700", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 1, notes: "Order 1" },
    { id: "pla-turquoise-r", name: "Turquoise", material: "PLA", color: "#40C9B0", rfidColor: "00B1B7", sku: "10605", spoolType: "refill", weightG: 1000, remainingG: 97, costPerSpool: 12.99, qty: 1, notes: "Order 1. Open — nearly empty." },
    { id: "pla-yellow-r", name: "Yellow", material: "PLA", color: "#FFD700", rfidColor: "F4EE2A", sku: "10400", spoolType: "refill", weightG: 1000, remainingG: 500, costPerSpool: 13.00, qty: 2, notes: "Order 1. 1× open + 1× sealed." },
    // Orders 3-5 refills
    { id: "pla-jade-white-r", name: "Jade White", material: "PLA", color: "#E8E4D9", rfidColor: "FFFFFF", sku: "10100", spoolType: "refill", weightG: 1000, remainingG: 555, costPerSpool: 12.99, qty: 2, emptied: 1, notes: "1× open + 1× sealed (Orders 3+5). 1st refill emptied 2026-05." },
    { id: "pla-black-r", name: "Black", material: "PLA", color: "#1a1a1a", rfidColor: "000000", sku: "10101", spoolType: "refill", weightG: 1000, remainingG: 777, costPerSpool: 12.99, qty: 1, emptied: 1, notes: "1× open (sealed one opened 2026-06-08 mid Zombicide — ran out). Order 5." },
    { id: "pla-maroon-red-r", name: "Maroon Red", material: "PLA", color: "#800020", sku: "10205", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 1, notes: "Order 3" },
    { id: "pla-brown-r", name: "Brown", material: "PLA", color: "#6D4C30", rfidColor: "6F5034", sku: "10800", spoolType: "refill", weightG: 1000, remainingG: 855, costPerSpool: 12.99, qty: 1, notes: "Order 3. Open." },
    { id: "pla-beige-r", name: "Beige", material: "PLA", color: "#D4C5A9", sku: "10201", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 3, notes: "1× Order 3, 2× Order 5" },
    { id: "pla-bronze-r", name: "Bronze", material: "PLA", color: "#8B6914", rfidColor: "847D48", sku: "10801", spoolType: "refill", weightG: 1000, remainingG: 722, costPerSpool: 13.99, qty: 1, notes: "Order 4. Open. RFID color is olive-khaki." },
    { id: "pla-silver-r", name: "Silver", material: "PLA", color: "#A8A9AD", sku: "10102", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 13.99, qty: 1, notes: "Order 4" },
    { id: "pla-blue-grey-r", name: "Blue Grey", material: "PLA", color: "#7A8B99", sku: "10602", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 13.99, qty: 1, notes: "Order 4" },
    { id: "pla-pink-r", name: "Pink", material: "PLA", color: "#F48FB1", sku: "10203", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 13.99, qty: 1, notes: "Order 4" },
    { id: "pla-cobalt-blue-r", name: "Cobalt Blue", material: "PLA", color: "#0047AB", sku: "10604", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 13.99, qty: 2, notes: "Order 4" },
    { id: "pla-bright-green-r", name: "Bright Green", material: "PLA", color: "#39B54A", sku: "10503", spoolType: "refill", weightG: 1000, remainingG: 1000, costPerSpool: 12.99, qty: 1, notes: "Order 5" },
    { id: "pla-pumpkin-orange-r", name: "Pumpkin Orange", material: "PLA", color: "#E8751A", rfidColor: "FF9016", sku: "10301", spoolType: "refill", weightG: 1000, remainingG: 548, costPerSpool: 12.99, qty: 2, notes: "1× open + 1× sealed (Order 5)." },

    // ══════════════════════════════════════════════
    // PLA BASIC — SPOOLS
    // ══════════════════════════════════════════════
    { id: "pla-jade-white-s", name: "Jade White", material: "PLA", color: "#E8E4D9", rfidColor: "FFFFFF", sku: "10100", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 2, emptied: 1, notes: "2× sealed (Orders 1+2). 1st spool emptied 2026-05-02." },
    { id: "pla-black-s", name: "Black", material: "PLA", color: "#1a1a1a", rfidColor: "000000", sku: "10101", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 3, emptied: 1, notes: "3× sealed (Orders 1+2+3). 1st spool emptied 2026-05-03." },
    { id: "pla-bambu-green-s", name: "Bambu Green", material: "PLA", color: "#00A651", sku: "10501", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.95, qty: 2, notes: "Order 1" },
    { id: "pla-cyan-s", name: "Cyan", material: "PLA", color: "#00BCD4", rfidColor: "0086D6", sku: "10603", spoolType: "spool", weightG: 1000, remainingG: 420, costPerSpool: 14.95, qty: 2, notes: "Order 1. 1× open + 1× sealed." },
    { id: "pla-red-s", name: "Red", material: "PLA", color: "#D32F2F", rfidColor: "C12E1F", sku: "10200", spoolType: "spool", weightG: 1000, remainingG: 721, costPerSpool: 14.95, qty: 2, notes: "Order 1. 1× open + 1× sealed." },
    { id: "pla-pumpkin-orange-s", name: "Pumpkin Orange", material: "PLA", color: "#E8751A", rfidColor: "FF9016", sku: "10301", spoolType: "spool", weightG: 1000, remainingG: 0, costPerSpool: 14.94, qty: 1, notes: "Order 2. Emptied 2026-05-16 (Cooler Mugger)." },
    { id: "pla-indigo-purple-s", name: "Indigo Purple", material: "PLA", color: "#4B0082", rfidColor: "482960", sku: "10701", spoolType: "spool", weightG: 1000, remainingG: 547, costPerSpool: 14.94, qty: 1, notes: "Order 3. Open." },
    { id: "pla-gray-s", name: "Gray", material: "PLA", color: "#808080", sku: "10103", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 4, notes: "1× Order 3, 3× Order 5" },
    { id: "pla-mistletoe-green-s", name: "Mistletoe Green", material: "PLA", color: "#2E6B4F", rfidColor: "3F8E43", sku: "10502", spoolType: "spool", weightG: 1000, remainingG: 947, costPerSpool: 14.94, qty: 1, notes: "Order 3. Open." },
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
    { id: "pla-silk-dawn", name: "Dawn Radiance", material: "PLA Silk", color: "linear-gradient(135deg, #F4A460, #DAA520, #E8C07A, #CD853F)", sku: "13912", spoolType: "spool", weightG: 1000, remainingG: 571, costPerSpool: 24.99, qty: 1, notes: "Multi-color silk. Reconciled 2026-06-06." },

    // ══════════════════════════════════════════════
    // PETG
    // ══════════════════════════════════════════════
    { id: "petg-white", name: "White", material: "PETG", color: "#F0F0F0", sku: "30106", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "" },
    { id: "petg-black", name: "Black", material: "PETG", color: "#1a1a1a", sku: "30105", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "" },
    { id: "petg-blue", name: "Reflex Blue", material: "PETG", color: "#1939B7", sku: "30603", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "" },
    { id: "petg-yellow", name: "Yellow", material: "PETG", color: "#FFC107", sku: "30402", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "" },
    { id: "petg-red", name: "Red", material: "PETG", color: "#C62828", sku: "30201", spoolType: "spool", weightG: 1000, remainingG: 1000, costPerSpool: 14.94, qty: 1, notes: "" },
    { id: "petg-clear", name: "Clear", material: "PETG", color: "#c8ddf0", rfidColor: "00000000", sku: "32101", spoolType: "spool", weightG: 1000, remainingG: 956, costPerSpool: 14.94, qty: 1, notes: "Order 2. Translucent — for lamp/light projects. Open." },

    // ══════════════════════════════════════════════
    // MYSTERY BOX
    // ══════════════════════════════════════════════
    { id: "mystery-laser", name: "Laser Mystery Box", material: "Mystery", color: "linear-gradient(135deg, #a371f7, #58a6ff, #a371f7)", sku: "mystery", spoolType: "spool", weightG: 0, remainingG: 0, costPerSpool: 39.99, qty: 1, notes: "Plywood/Acrylic/PU/Metal — contents TBD" },
  ]
};
