import {Driver} from './driver';

export class Infringement {
  /**
   * Type of Penalty
   */
  penaltyType: number;
  /**
   * Type of Infringement
   */
  infringementType: number;
  /**
   * not Used yet since the UDP Data is defect
   */
  otherCar?: Driver;
  /**
   * Penalty Time
   */
  time?: number;
  /**
   * Number of Lap the infringement occured
   */
  lapNum?: number;
  /**
   * Number of Grid Penalty | Places illiagly gained
   */
  placesGained?: number;

  constructor(
    ...args: [
      penaltyType: number,
      infringementType: number,
      time: number,
      lapNum: number,
      placesGained: number
    ]
  ) {
    this.infringementType = args[0];
    this.penaltyType = args[1];
    if (args[2] !== undefined && args[2] !== 255) {
      this.time = args[2];
    }
    if (args[3] !== undefined) {
      this.lapNum = args[3];
    }
    if (args[4] !== undefined && args[4] !== 255) {
      this.placesGained = args[4];
    }
  }
}
