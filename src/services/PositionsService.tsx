// TODO: Refactor this file to use a more modern approach, such as using a database or an API for data storage and retrieval.
import { Position } from "@/positions/types";

const STORAGE_KEY = "positions";

export default class PositionsService {
  private static getStoredPositions(): Position[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private static savePositions(positions: Position[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }

  static async getPositions(): Promise<Position[]> {
    return this.getStoredPositions();
  }

  static async createPosition(
    position: Omit<Position, "id">,
  ): Promise<Position> {
    const positions = this.getStoredPositions();
    const newPosition = {
      ...position,
      id: positions.length ? Math.max(...positions.map((p) => p.id)) + 1 : 1,
    };

    this.savePositions([...positions, newPosition]);

    return newPosition;
  }

  static async updatePosition(position: Position): Promise<Position> {
    const positions = this.getStoredPositions();
    const index = positions.findIndex((p) => p.id === position.id);

    if (index === -1) {
      throw new Error("Position not found");
    }

    positions[index] = position;
    this.savePositions(positions);

    return position;
  }

  static async deletePosition(id: number): Promise<void> {
    const positions = this.getStoredPositions();

    this.savePositions(positions.filter((p) => p.id !== id));
  }
}
