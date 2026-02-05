"use strict";
/**
 * Shared Combat Types
 * Pure types for combat calculations
 * No server-specific or client-specific dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttackPattern = exports.WeaponType = void 0;
// ============================================================================
// Weapon System (Sprint 4)
// ============================================================================
var WeaponType;
(function (WeaponType) {
    WeaponType["Sword"] = "Sword";
    WeaponType["Spear"] = "Spear";
    WeaponType["Bow"] = "Bow";
    WeaponType["Dagger"] = "Dagger";
})(WeaponType || (exports.WeaponType = WeaponType = {}));
var AttackPattern;
(function (AttackPattern) {
    AttackPattern["MeleeArc"] = "MeleeArc";
    AttackPattern["MeleeThrust"] = "MeleeThrust";
    AttackPattern["Projectile"] = "Projectile";
    AttackPattern["MeleeQuick"] = "MeleeQuick";
})(AttackPattern || (exports.AttackPattern = AttackPattern = {}));
