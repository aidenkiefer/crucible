# Crucible — Base Gladiator Sprite Refinement Guide (Next Batch)

This guide distills the key lessons learned from reviewing high-quality reference gladiator sprites and analyzing why the initial PixelLab-generated base gladiator felt bland, generic, and off-brand. Use this document to guide the **next batch of base gladiator sprite generation**, before moving on to equipped variants and animations.

This is a refinement pass, not a reset.

---

## 1. What the Reference Gladiator Art Gets Right

The reference sprites succeed not because they are “detailed,” but because they make **intentional visual decisions** that read clearly at small pixel sizes.

### 1.1 Silhouette First, Details Second
- Each gladiator has **one dominant shape**:
  - shield-heavy
  - weapon-forward
  - helmet plume
- Secondary details support the silhouette, never compete with it.
- The sprite reads instantly at a distance.

Key principle:
> If the silhouette is strong, the sprite will feel detailed even with fewer pixels.

---

### 1.2 Intentional Asymmetry
The reference sprites avoid symmetry almost entirely:
- One arm armored, the other exposed
- Uneven cloth, straps, or wraps
- Shield on one side, weapon on the other

Asymmetry creates:
- personality
- tension
- a handcrafted, lived-in feel

Symmetry = generic.

---

### 1.3 Exaggerated Material Contrast
Materials are pushed harder than realism:
- Bright bronze highlights next to dull leather
- Pale skin against deep shadow pockets
- Cloth and metal are clearly separated by value, not texture

Important:
> Readability matters more than realism in pixel art.

---

### 1.4 Chunky, Heavy Gear Language
Weapons and armor:
- Are thicker than real-world proportions
- Feel heavy and grounded
- Occupy clear space relative to the body

Thin or delicate gear reads as decorative, not battle-ready.

---

### 1.5 Posture Communicates Intent
Even idle poses show readiness:
- Slight forward lean
- Bent knees
- Engaged stance

Avoid neutral, upright “character select” poses for base fighters.

---

## 2. Why the Initial Base Gladiator Felt Wrong

### 2.1 “Blank Character” Is the Wrong Mental Model
The term “blank” causes the generator to produce:
- low-detail
- safe
- generic outputs

What we actually want:
> A physically distinct base body with minimal gear, not a featureless mannequin.

---

### 2.2 Equipment Was Implicitly Allowed
Words like:
- gladiator
- fighter
- battle-hardened

implicitly invite:
- armor
- weapons
- helmets

If equipment is not explicitly forbidden, it will appear.

---

### 2.3 Detail Was Evenly Distributed
The generated sprite:
- had lots of micro-detail
- no focal points
- no strong contrast hierarchy

This results in “AI pixel mush.”

---

## 3. Redefining the Base Gladiator (Critical Shift)

Stop thinking in terms of “blank.”

Instead, define a **Base Gladiator Body** as:
- minimally equipped
- physically expressive
- asymmetrical
- visually grounded

This base body becomes the **visual anchor** for all future equipment.

---

## 4. Prompting Principles for the Next Batch

### 4.1 Explicit Constraints (Non-Negotiable)
Always include:
- “no armor”
- “no weapons”
- “no helmet”

Do not rely on implication.

---

### 4.2 Silhouette & Asymmetry Cues
Include language that enforces:
- uneven wraps
- asymmetrical cloth
- one arm wrapped, one bare
- strong forward-leaning stance

---

### 4.3 Chunkiness Over Detail
Ask for:
- thick limbs
- exaggerated anatomy
- chunky forms

Avoid asking for:
- intricate patterns
- fine ornamentation
- excessive texture

---

### 4.4 Contrast Over Color Count
Use:
- limited palette
- deep shadows
- bright accent pops

Avoid:
- many similar mid-tones
- subtle gradients everywhere

---

## 5. Recommended Base Gladiator Prompt (Next Batch)

Use this as the starting point for the next generation pass:

Roman gladiator base body, heroic proportions with broad shoulders and thick limbs, **no armor and no weapons**, bare torso with scars, dirt, and wear, simple cloth loincloth with asymmetrical leather wraps, one arm partially wrapped and the other bare, gritty coliseum fighter stance leaning slightly forward, strong readable silhouette, exaggerated chunky anatomy, limited dark stone and sand color palette with small blood red accents, high material contrast between skin, cloth, and leather, deep shadow pockets under arms and waist, retro 16-bit pixel art inspiration, readable at 48px, single black outline, moody lighting, transparent background

---

## 6. How to Use Reference Art Going Forward

### 6.1 References Are for Validation, Not Direct Steering
- Do not say “like this image” in prompts.
- Encode *principles* from the reference art into text instead.

Use references to ask:
- Does the silhouette read?
- Is asymmetry present?
- Is contrast strong?

---

### 6.2 Lock Prompts Once They Hit 80%
Do not endlessly tweak:
- prompt
- references
- proportions

Change **one variable at a time**, then lock.

---

## 7. Generation Order Reminder

For clarity, this guide applies only to **Phase 1: Base Gladiators**.

Correct order:
1) Base gladiator bodies (this guide)
2) Equipped gladiator variants (using base as context)
3) Inventory icons (derived from equipped visuals)

Do not skip or reorder.

---

## 8. Success Criteria for the Next Batch

A base gladiator sprite is successful if:
- It reads clearly at 48px
- It has a strong silhouette
- It feels gritty and grounded
- It looks ready for combat even without equipment
- It feels unique, not default or generic

If these are met, move forward.

---

## 9. Final Note

This is not about adding more detail — it’s about **making fewer, stronger visual decisions**.

Once the base body is right, everything else (armor, weapons, rarity skins) becomes easier, cheaper, and more consistent.

This guide is now the source of truth for base gladiator sprite generation.
