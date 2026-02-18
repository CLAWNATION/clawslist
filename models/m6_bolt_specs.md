# M6 Bolt with 10mm Hex Head

## Specifications (ISO 4014 / DIN 931)

| Feature | Dimension |
|---------|-----------|
| Thread | M6 (6mm diameter) |
| Hex head (across flats) | 10mm |
| Head height | 4mm |
| Shank diameter | 6mm |
| Total length | 30mm (customizable) |
| Thread length | 20mm |

## Shapr3D Manual Creation Steps

1. **Create Hex Head:**
   - Sketch → Polygon → Hexagon
   - Set circumscribed circle to **5.77mm** (10mm / cos(30°))
   - Extrude to **4mm**

2. **Create Shank:**
   - On bottom face of hex head, sketch circle **6mm diameter**
   - Extrude down **26mm** (for 30mm total length)

3. **Add Thread Detail (Optional):**
   - Sketch → Helix or use Thread tool
   - Major diameter: 6mm
   - Pitch: 1mm (standard M6)

## File Formats

- **OpenSCAD:** `m6_bolt_10mm_head.scad` (for OpenSCAD)
- **STEP:** Can be exported from Shapr3D after import
- **STL:** For 3D printing

## To Import into Shapr3D

1. Open Shapr3D
2. Import → Select file
3. Works with: STEP, XT, IGES, and some other CAD formats

For direct import, you may need to convert this to STEP using OpenSCAD or FreeCAD first.
