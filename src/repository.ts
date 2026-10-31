import type { Wizard, Spell, NewWizard } from "./types";
import { Log, MeasureTime, ValidateSpellPower } from "./decorators";

export class Repository<T extends { id: number }> {
  private items: T[] = [];

  @Log
  add(item: T): void {
    this.items.push(item);
  }

  @MeasureTime
  findById(id: number): T | undefined {
    return this.items.find(item => item.id === id);
  }

  getAll(): T[] {
    return [...this.items];
  }

  update(id: number, changes: Partial<T>): boolean {
    const item = this.findById(id);

    if (!item) return false;

    Object.assign(item, changes);
    return true;
  }

  protected nextId(): number {
    return this.items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }
}

export class WizardRepository extends Repository<Wizard> {
  @Log
  register(newWizard: NewWizard): Wizard {
    const wizard = { ...newWizard, id: this.nextId() } as Wizard;
    this.add(wizard);
    return wizard;
  }

  findByHouse(house: Wizard["house"]): Wizard[] {
    return this.getAll().filter(
      wizard => wizard.house === house
    );
  }
}

// export class SpellRepository extends Repository<Spell> {
//   @ValidateSpellPower
//   add(item: Spell): void {
//     super.add(item);
//   }
// }
export class SpellRepository extends Repository<Spell> {
  @ValidateSpellPower
  override add(spell: Spell): void {
    super.add(spell);
  }
}