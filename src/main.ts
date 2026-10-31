import {
  type Wizard,
  type Spell,
  type AcademyEvent,
  type SpellCastEvent,
  type House,
  type HousePoints,
  type SpellCategory,
  type SpellOutput,
  type ArrayElement,
  type WizardSummary,
  type WizardUpdate,
  type AttackSpell,
  type NonHealingCategory,
  
} from "./types";

import { WizardRepository, SpellRepository } from "./repository";
import { Log, Cache } from "./decorators";
// function isHouse(value: unknown): value is House {
//   return (
//     value === "Gryffindor" ||
//     value === "Slytherin" ||
//     value === "Ravenclaw" ||
//     value === "Hufflepuff"
//   );
// }

const validHouses: readonly House[] = [
  "Gryffindor",
  "Slytherin",
  "Ravenclaw",
  "Hufflepuff"
];

function isHouse(value: unknown): value is House {
  return (
    typeof value === "string" &&
    validHouses.some(house => house === value)
  );
}

// Type guard: safely narrow unknown data to a Wizard.
function isWizard(value: unknown): value is Wizard {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "number" &&
    typeof candidate.name === "string" &&
    isHouse(candidate.house) &&
    typeof candidate.level === "number" &&
    typeof candidate.active === "boolean"
  );
}

function handleSpellCast(event: SpellCastEvent): void {
  console.log(
    `Wizard ${event.wizardId} cast ${event.spellName}`
  );
}

class AcademyService {
  constructor(
    private readonly wizards: WizardRepository,
    private readonly spells: SpellRepository
  ) {}

  @Log
  castSpell(wizardId: number, spellId: number): string {
    const wizard = this.wizards.findById(wizardId);
    const spell = this.spells.findById(spellId);

    if (!wizard || !spell) {
      throw new Error("Wizard or spell not found");
    }

    return `${wizard.name} casts ${spell.name}!`;
  }

  findByHouse(house: House): WizardSummary[] {
    return this.wizards
      .getAll()
      .filter(wizard => wizard.house === house)
      .map(({ id, name, house }) => ({ id, name, house }));
  }

  updateWizard(id: number, changes: WizardUpdate): boolean {
    return this.wizards.update(id, changes);
  }

  getSpellEvents(events: AcademyEvent[]): Extract<AcademyEvent, { type: "spell-cast" }>[] {
    return events.filter(
      (event): event is Extract<AcademyEvent, { type: "spell-cast" }> =>
        event.type === "spell-cast"
    );
  }
}

class SpellCalculator {
  @Cache
  calculatePower(basePower: number, multiplier: number): number {
    console.log("Calculating...");

    return basePower * multiplier;
  }
}

const wizards = new WizardRepository();
const spells = new SpellRepository();

wizards.add({
  id: 1,
  name: "Harry Potter",
  house: "Gryffindor",
  level: 5,
  active: true,
  patronus: "Stag"
});

wizards.add({
  id: 2,
  name: "Hermione Granger",
  house: "Gryffindor",
  level: 8,
  active: true
});

wizards.add({
  id: 3,
  name: "Draco Malfoy",
  house: "Slytherin",
  level: 6,
  active: true
});

spells.add({
  id: 101,
  name: "Expelliarmus",
  category: "attack",
  power: 80
});

spells.add({
  id: 102,
  name: "Protego",
  category: "defense",
  power: 60
});

const academy = new AcademyService(wizards, spells);

console.log("\n--- Register a new wizard ---");
const ron = wizards.register({
  name: "Ron Weasley",
  house: "Gryffindor",
  level: 4,
  active: true
});
console.log(ron);
console.log(wizards.findById(4)?.name); // "Ron Weasley"
console.log(wizards.getAll().length);   // 4

console.log("\n--- Cast a spell ---");
console.log(academy.castSpell(1, 101));

console.log("\n--- Find wizards by house ---");
console.log(academy.findByHouse("Gryffindor"));

console.log("\n--- Repository findByHouse ---");
console.log(wizards.findByHouse("Gryffindor"));
console.log(wizards.findByHouse("Slytherin"));
console.log(wizards.findByHouse("Ravenclaw")); // []

// Erreur de compilation attendue (décommente pour vérifier) :
// wizards.findByHouse("Durmstrang");

console.log("\n--- Update a wizard ---");
academy.updateWizard(1, { level: 6 });
console.log(wizards.findById(1));

console.log("\n--- Type guard ---");
const unknownWizard: unknown = wizards.findById(1);
if (isWizard(unknownWizard)) {
  console.log(`${unknownWizard.name} belongs to ${unknownWizard.house}`);
}

console.log("\n--- Record utility type ---");
const points: HousePoints = {
  Gryffindor: 100,
  Slytherin: 80,
  Ravenclaw: 90,
  Hufflepuff: 70
};
console.log(points);

console.log("\n--- Extract spell-cast events ---");
const events: AcademyEvent[] = [
  { type: "spell-cast", wizardId: 1, spellName: "Lumos" },
  { type: "level-up", wizardId: 2, newLevel: 9 },
  { type: "wizard-expelled", wizardId: 3 }
];
console.log(academy.getSpellEvents(events));

console.log("\n--- SpellCastEvent type ---");
const castEvent: SpellCastEvent = {
  type: "spell-cast",
  wizardId: 1,
  spellName: "Lumos"
};
console.log(castEvent);

// Erreur de compilation attendue (décommente pour vérifier) :
// const badEvent: SpellCastEvent = { type: "level-up", wizardId: 2, newLevel: 9 };

console.log("\n--- Handle spell cast ---");
handleSpellCast({
  type: "spell-cast",
  wizardId: 1,
  spellName: "Expelliarmus"
});

// Erreur de compilation attendue (décommente pour vérifier) :
// handleSpellCast({ type: "level-up", wizardId: 2, newLevel: 9 });

console.log("\n--- Validate spell power ---");
try {
  spells.add({
    id: 103,
    name: "Broken Spell",
    category: "attack",
    power: -10
  });
} catch (error: unknown) {
  console.log(
    "Rejected:",
    error instanceof Error ? error.message : error
  );
}

spells.add({
  id: 104,
  name: "Lumos",
  category: "healing",
  power: 10
});
console.log(spells.findById(103)); // undefined (rejeté)
console.log(spells.findById(104)?.name); // "Lumos"

console.log("\n--- Cache decorator ---");
const calculator = new SpellCalculator();

console.log(calculator.calculatePower(10, 3));
console.log(calculator.calculatePower(10, 3));
console.log(calculator.calculatePower(5, 2));

// Test : le cache est séparé par instance
const calculator2 = new SpellCalculator();
console.log(calculator2.calculatePower(10, 3));

console.log("\n--- Strict type guard ---");
console.log(isHouse("Gryffindor")); // true
console.log(isHouse("Durmstrang")); // false
console.log(isHouse(42));           // false

console.log(
  isWizard({
    id: 10,
    name: "Viktor Krum",
    house: "Durmstrang",
    level: 7,
    active: true
  })
); // false

console.log(
  isWizard({
    id: 11,
    name: "Luna Lovegood",
    house: "Ravenclaw",
    level: 5,
    active: true
  })
); // true

// Compile-time demonstrations: these aliases are checked by TypeScript.
type CastArguments = Parameters<AcademyService["castSpell"]>;
type CastResult = ReturnType<AcademyService["castSpell"]>;
type AttackOutput = SpellOutput<"attack">; // number
type HealingOutput = SpellOutput<"healing">; // string
type SpellItem = ArrayElement<Spell[]>; // Spell
type AttackSpellExample = AttackSpell;
type RemainingCategories = NonHealingCategory;
type CategoryExample = SpellCategory;

const typeExamples: [
  CastArguments,
  CastResult,
  AttackOutput,
  HealingOutput,
  SpellItem,
  AttackSpellExample["category"],
  RemainingCategories,
  CategoryExample
] | null = null;

void typeExamples;