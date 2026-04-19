---
title: Clay Printing
category: Personal Projects
order: 10
summary: Clay extrusion printing experiments with custom Grasshopper-generated GCODE, non-planar slicing, and geometry texture studies.
images:
  - TexturedVaseGrasshopperOverview.png
  - SpiralAttractor.png
  - CustomGcodeTexturedVase.png
  - NonPlanarSlicing.png
  - PrintingVase.jpg
  - BioMaterialPrinting.jpg
  - CoffeeDripper.jpg
  - Kiln.jpg
  - GlazedPiece.jpg
  - WavyCup.jpg
  - AnemoneVase.jpg
---

## Overview
I experimented with clay extrusion printing using a PotterBot to learn **Rhino** and **Grasshopper**. For most prints, I created custom Grasshopper programs that generated GCODE directly so I could control and optimize print quality.

I focused on understanding how extrusion settings, toolpath strategy, and geometry influence final results.

### Techniques
I used attractor points and attractor lines to drive geometric changes during printing.

I also used dispatch and weave components in Grasshopper to generate unique surface textures.

### Non-Planar Slicing
I generated non-planar GCODE so printed layers followed model topology instead of strict flat layer heights.
