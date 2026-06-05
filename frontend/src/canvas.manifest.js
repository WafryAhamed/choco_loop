export const manifest = {
  screens: {
    scr_mno5iq: { name: "Login", route: "/login", position: { "x": 160, "y": 1820 } },
    scr_67u7ty: { name: "Dashboard", route: "/dashboard", position: { "x": 1560, "y": 1820 } },
    scr_d4xdlw: { name: "Inventory", route: "/inventory", position: { "x": 160, "y": 5780 } },
    scr_8poa6k: { name: "Assign Task", route: "/tasks/assign", position: { "x": 160, "y": 3800 } },
    scr_4kxj8g: { name: "Task History", route: "/tasks/history", position: { "x": 1560, "y": 3800 } },
    scr_ff3jck: { name: "Camera", route: "/camera", position: { "x": 2960, "y": 3800 } },
    scr_k0u8ot: { name: "Settings", route: "/settings", position: { "x": 2800, "y": 0 }, isDefaultRow: true },
    scr_ftcjf5: { name: "Analytics", route: "/analytics", position: { "x": 160, "y": 7760 } }
  },
  sections: {
    sec_wk2ozf: { name: "Onboarding & Auth", x: 0, y: 1600, width: 2920, height: 1180 },
    sec_tk10x4: { name: "Task Management", x: 0, y: 3580, width: 4320, height: 1180 },
    sec_zx1ppx: { name: "Inventory Management", x: 0, y: 5560, width: 1520, height: 1180 },
    sec_2f3dl6: { name: "Analytics & Reporting", x: 0, y: 7540, width: 1520, height: 1180 }
  },
  layers: [
  { kind: "screen", id: "scr_k0u8ot" },
  { kind: "section", id: "sec_wk2ozf", children: [
    { kind: "screen", id: "scr_mno5iq" },
    { kind: "screen", id: "scr_67u7ty" }]
  },
  { kind: "section", id: "sec_tk10x4", children: [
    { kind: "screen", id: "scr_8poa6k" },
    { kind: "screen", id: "scr_4kxj8g" },
    { kind: "screen", id: "scr_ff3jck" }]
  },
  { kind: "section", id: "sec_zx1ppx", children: [
    { kind: "screen", id: "scr_d4xdlw" }]
  },
  { kind: "section", id: "sec_2f3dl6", children: [
    { kind: "screen", id: "scr_ftcjf5" }]
  }]

};