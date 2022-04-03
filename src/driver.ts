import EventEmitter from 'events';
import {LapHistoryData} from 'f1-2021-udp/build/src/parsers/packets/types';
import {Infringement} from './Infringement';
import * as dotenv from 'dotenv';

dotenv.config();

export enum DRIVER_EVENTS {
  SpeedTrapUpdate = 'SpeedTrapUpdate',
  MaxSpeedTrapUpdate = 'MaxSpeedTrapUpdate',
  InfrigementAdded = 'InfrigementAdded',
  MaxGForceUpdate = 'MaxGForceUpdate',
  TrackStatusUpdate = 'TrackStatusUpdate',
  Sector1Update = 'Sector1Update',
  Sector2Update = 'Sector2Update',
  TotalDistanceUpdate = 'TotalDistanceUpdate',
  InvalidationUpdate = 'InvalidationUpdate',
  WingStatus = 'WingStatus',
  CurrentSectorUpdate = 'CurrentSectorUpdate',
  CurrentLapNumUpdate = 'CurrentLapNumUpdate',
  BestLapTimeUpdate = 'BestLapTimeUpdate',
  CarPositionUpdate = 'CarPositionUpdate',
  FlagUpdate = 'FlagUpdate',
  TyreStatus = 'TyreStatus',
  TyreWear = 'TyreWear',
  LastLapTimeUpdate = 'LastLapTimeUpdate',
}

export class Driver extends EventEmitter {
  static lineupFile = process.env.LINEUP_FILE;
  static lineup = require('../../lineups/' + Driver.lineupFile);

  _delta = 0;
  _numUnservedDriveThroughPens = 0;
  _numUnservedStopGoPens = 0;
  _ers?: number = 0;
  _team = 95;
  _yourTelemetry = 0;
  _bestSector1?: number;
  _bestSector2?: number;
  _bestSector3?: number;
  _lapHistory: LapHistoryData[] = new Array<LapHistoryData>();
  _penaltyTime = 0;
  _pitCount = 0;
  _flag = -1;
  _startTime = 0;
  _maxGForce = 0;
  _trackStatus = 0;
  _totalDistance = 0;
  _currentLapInvalid = 0;
  _sector2Time?: number;
  _sector1Time?: number;
  _currentSector?: number;
  _currentLapNum?: number;
  _bestLapTime?: number;
  _carPosition = 0;
  _lastLapTime?: number;
  _lastSpeedTrap?: number = 0;
  _maxSpeedTrap = 0;
  _driverNumber: number;
  _wingdamage: {left: number; right: number} = {left: 0, right: 0};
  _infrigements?: Infringement[] = new Array<Infringement>();
  _tyreWear = [0, 0, 0, 0];
  _currentTyre: {tyre: number; age: number} = {tyre: 0, age: 0};
  _driverName?: string;
  _gridPosition = 0;
  _resultStatus = 0;
  _driverStatus = 0;
  _tyreHistory = new Map();
  _currentLapTime?: number;
  _totalTime?: number;

  /**
   * Setter for CurrentLapTime
   * @param m_currentLapTime Time Spend in current Lap
   */
  updateCurrentLapTime(m_currentLapTime: number) {
    this._currentLapTime = m_currentLapTime;
  }

  /**
   * Setter for number of unserved Drive Through Penalties
   * @param m_numUnservedDriveThroughPens number of unserved Drive Through Penalties
   */
  updateNumUnservedDriveThroughPens(m_numUnservedDriveThroughPens: number) {
    this._numUnservedDriveThroughPens = m_numUnservedDriveThroughPens;
  }

  /**
   * Setter for number of Unserved Stop & Go Penalties of a Driver
   * @param m_numUnservedStopGoPens number of Unserved Stop & Go Penalties of a Driver
   */
  updateNumUnservedStopGoPens(m_numUnservedStopGoPens: number) {
    this._numUnservedStopGoPens = m_numUnservedStopGoPens;
  }

  /**
   * Setter for ERS
   * @param m_ersStoreEnergy ERS in Joules
   */
  updateERS(m_ersStoreEnergy: number) {
    this._ers = m_ersStoreEnergy / 40000;
  }

  /**
   * Setter for Team
   * @param m_teamId TeamID
   */
  updateTeam(m_teamId: number) {
    this._team = m_teamId;
  }

  /**
   * Setter for Your Telemetry
   * @param m_yourTelemetry Visibility of Telemetry (public=1|restricted=0)
   */
  updateTelemetry(m_yourTelemetry: number) {
    this._yourTelemetry = m_yourTelemetry;
  }

  /**
   * Clones a Driver worked first as a workaround
   * @param driver Driver to be cloned
   * @returns Driver Object of cloned driver
   */
  static clone(driver: Driver): Driver {
    const resultDriver = new Driver(driver._driverNumber);
    resultDriver._bestSector1 = driver._bestSector1;
    resultDriver._bestSector2 = driver._bestSector2;
    resultDriver._bestSector3 = driver._bestSector3;
    resultDriver._lapHistory = driver._lapHistory;
    resultDriver._penaltyTime = driver._penaltyTime;
    resultDriver._pitCount = driver._pitCount;
    resultDriver._flag = driver._flag;
    resultDriver._startTime = driver.startTime;
    resultDriver._maxGForce = driver._maxGForce;
    resultDriver._trackStatus = driver._trackStatus;
    resultDriver._totalDistance = driver._totalDistance;
    resultDriver._currentLapInvalid = driver._currentLapInvalid;
    resultDriver._sector2Time = driver._sector2Time;
    resultDriver._sector1Time = driver._sector1Time;
    resultDriver._currentSector = driver._currentSector;
    resultDriver._currentLapNum = driver._currentLapNum;
    resultDriver._bestLapTime = driver._bestLapTime;
    resultDriver._carPosition = driver._carPosition;
    resultDriver._lastLapTime = driver._lastLapTime;
    resultDriver._lastSpeedTrap = driver._lastSpeedTrap;
    resultDriver._maxSpeedTrap = driver._maxSpeedTrap;
    resultDriver._driverNumber = driver._driverNumber;
    resultDriver._wingdamage = driver._wingdamage;
    resultDriver._infrigements = driver._infrigements;
    resultDriver._tyreWear = driver._tyreWear;
    resultDriver._currentTyre = driver._currentTyre;
    resultDriver._driverName = Driver.lineup[driver._driverNumber];
    resultDriver._gridPosition = driver._gridPosition;
    resultDriver._resultStatus = driver._resultStatus;
    resultDriver._driverStatus = driver._driverStatus;

    return resultDriver;
  }

  /**
   * Setter for Driver Status
   * @param m_driverStatus driver Status
   */
  updateDriverStatus(m_driverStatus: number) {
    this._driverStatus = m_driverStatus;
  }

  /**
   * Setter for Result Status
   * @param m_resultStatus Result Status
   */
  updateResultStatus(m_resultStatus: number) {
    this._resultStatus = m_resultStatus;
  }

  /**
   * Setter for Lap History
   * @param lapHistory Lap History : LapHistoryData[]
   */
  updateLapHistory(lapHistory: LapHistoryData[]) {
    this._lapHistory = lapHistory;
  }

  /**
   * Setter for Penalty Time
   * @param m_penalties Penalties in s
   */
  updatePenaltyTime(m_penalties: number) {
    this._penaltyTime = m_penalties;
  }

  /**
   * Setter for Number of pitstops
   * @param m_numPitStops Number of Pitstops of a driver
   */
  updatePitCount(m_numPitStops: number) {
    this._pitCount = m_numPitStops;
  }

  /**
   * Setter for Last Laptime
   * @param m_lapTimeInMS Laptime of Last Lap in Milliseconds
   */
  updateLastLapTime(m_lapTimeInMS: number) {
    if (this._lastLapTime !== m_lapTimeInMS) {
      this._lastLapTime = m_lapTimeInMS;
      this.emit(DRIVER_EVENTS.LastLapTimeUpdate, this._driverNumber);
    }
  }

  /**
   * Setter for best Sector 1 Time
   * @param bestSector1 Sector 1 Time of best Sector 1 of Driver
   */
  updateBestSector1(bestSector1: number) {
    this._bestSector1 = bestSector1;
  }

  /**
   * Setter for best Sector 2 Time
   * @param bestSector1 Sector 2 Time of best Sector 2 of Driver
   */
  updateBestSector2(bestSector2: number) {
    this._bestSector2 = bestSector2;
  }

  /**
   * Setter for best Sector 3 Time
   * @param bestSector1 Sector 3 Time of best Sector 3 of Driver
   */
  updateBestSector3(bestSector3: number) {
    this._bestSector3 = bestSector3;
  }

  /**
   * not used. Idea of 0-200kmh time
   */
  public get startTime(): number {
    return this._startTime;
  }

  /**
   * Constructor
   * @param driverNumber Driver Number of a Car
   */
  constructor(driverNumber: number) {
    super();
    this._driverNumber = driverNumber;
    if (Driver.lineup[driverNumber] !== undefined) {
      this._driverName = Driver.lineup[driverNumber];
    }
  }

  /**
   * Setter for Grid Position
   * @param _gridPosition Position of Car at the Start of Race
   */
  updateGridPosition(_gridPosition: number) {
    this._gridPosition = _gridPosition;
  }

  /**
   * Setter for  speed
   * @param speed achieved speed in the speed trap during last lap
   */
  addSpeedTrap(speed: number) {
    this._lastSpeedTrap = speed;
    this.emit(
      DRIVER_EVENTS.SpeedTrapUpdate,
      this._driverNumber,
      this._lastSpeedTrap
    );
    if (this._lastSpeedTrap > this._maxSpeedTrap) {
      this._maxSpeedTrap = this._lastSpeedTrap;
      this.emit(
        DRIVER_EVENTS.MaxSpeedTrapUpdate,
        this._driverNumber,
        this._maxSpeedTrap
      );
    }
  }

  /**
   * Adds a Infringement to a Driver
   * @param newInfrigment Infringement to be added
   */
  addInfrigment(newInfrigment: Infringement) {
    this._infrigements?.push(newInfrigment);
    this.emit(DRIVER_EVENTS.InfrigementAdded, this._driverNumber);
  }

  /**
   * Setter for Max G-Force
   * @param gForce Setter for Max G-Force, checks if current Max is smaller than gForce
   */
  updateMaxGForce(gForce: number) {
    if (this._maxGForce < gForce) {
      this._maxGForce = gForce;
      this.emit(DRIVER_EVENTS.MaxGForceUpdate, this._driverNumber, gForce);
    }
  }

  /**
   * Setter for Driver Status
   * @param m_driverStatus Driver Status
   */
  updateTrackStatus(m_driverStatus: number) {
    if (this._trackStatus !== m_driverStatus) {
      this._trackStatus = m_driverStatus;
      this.emit(
        DRIVER_EVENTS.TrackStatusUpdate,
        this._driverNumber,
        m_driverStatus
      );
    }
  }

  /**
   * Setter for Sector 1 Time
   * @param m_sector1Time Time of Sector 1 in current Lap
   */
  updateSector1Time(m_sector1Time: number) {
    this._sector1Time = m_sector1Time;
  }

  /**
   * Setter for Sector 2 Time
   * @param m_sector2Time Time of Sector 2 in current Lap
   */
  updateSector2Time(m_sector2Time: number) {
    this._sector2Time = m_sector2Time;
  }

  /**
   * Setter for Total Distance
   * @param m_totalDistance Total Distance Traveled from Start of Race
   */
  updateTotalDistance(m_totalDistance: number) {
    if (m_totalDistance > 0) {
      if (this._totalDistance !== m_totalDistance) {
        this._totalDistance = m_totalDistance;
        this.emit(
          DRIVER_EVENTS.TotalDistanceUpdate,
          this._driverNumber,
          m_totalDistance
        );
      }
    }
  }

  /**
   * Setter for Invalidation Flag of Current Lap
   * @param m_currentLapInvalid Flag for Current Lap Invalid
   */
  updateCurrentLapInvalid(m_currentLapInvalid: number) {
    if (this._currentLapInvalid !== m_currentLapInvalid) {
      this._currentLapInvalid = m_currentLapInvalid;
      this.emit(DRIVER_EVENTS.InvalidationUpdate, this._driverNumber);
    }
  }

  /**
   * Setter for Current Sector
   * @param m_sector Sector the Car is currently in
   */
  updateCurrentSector(m_sector: number) {
    if (this._currentSector !== m_sector) {
      this._currentSector = m_sector;
      this.emit(
        DRIVER_EVENTS.CurrentSectorUpdate,
        this._driverNumber,
        m_sector
      );
    }
  }

  /**
   * Setter for Current Lap Number
   * @param m_currentLapNum Current Lap of Car
   */
  updateCurrentLap(m_currentLapNum: number) {
    if (this._currentLapNum !== m_currentLapNum) {
      this._currentLapNum = m_currentLapNum;
      this.emit(
        DRIVER_EVENTS.CurrentLapNumUpdate,
        this._driverNumber,
        m_currentLapNum
      );
    }
  }

  /**
   * Setter for Best Lap
   * @param m_bestLapTime Best Lap Time of Driver
   */
  updateBestLapTime(m_bestLapTime: number) {
    if (m_bestLapTime !== undefined) {
      this._bestLapTime = m_bestLapTime;
    }
  }

  /**
   * Setter for Car Position
   * @param m_carPosition Position of Driver (P1-P22)
   */
  updateCarPosition(m_carPosition: number) {
    if (this._carPosition !== m_carPosition) {
      this._carPosition = m_carPosition;
      this.emit(
        DRIVER_EVENTS.CarPositionUpdate,
        this._driverNumber,
        m_carPosition
      );
    }
  }

  /**
   * Setter for flag
   * @param m_vehicleFiaFlags Flag that is shown to Driver
   */
  updateFlag(m_vehicleFiaFlags: number) {
    if (this._flag !== m_vehicleFiaFlags) {
      this._flag = m_vehicleFiaFlags;
      this.emit(DRIVER_EVENTS.FlagUpdate, this._driverNumber, this._flag);
    }
  }

  /**
   * Setter of Current Tyre
   * @param m_visualTyreCompound Typre Compound that is used
   * @param m_tyresAgeLaps Age of the current Tyre in Laps
   */
  updateTyre(m_visualTyreCompound: number, m_tyresAgeLaps: number) {
    if (
      this._currentTyre.age !== m_tyresAgeLaps ||
      this._currentTyre.tyre !== m_visualTyreCompound
    ) {
      this._currentTyre.age = m_tyresAgeLaps;
      this._currentTyre.tyre = m_visualTyreCompound;
      this.emit(
        DRIVER_EVENTS.TyreStatus,
        this._driverNumber,
        this._currentTyre
      );
    }
  }

  /**
   * Setter for Right Front Wing
   * @param m_frontRightWingDamage Percentage of Damage of the Right Front Wing
   */
  updateFrontRightWingDamage(m_frontRightWingDamage: number) {
    const wingbefore = this._wingdamage.right;
    if (wingbefore !== m_frontRightWingDamage) {
      this._wingdamage.right = m_frontRightWingDamage;
      this.emit(DRIVER_EVENTS.WingStatus, this._driverNumber, this._wingdamage);
    }
  }

  /**
   * Setter for left Front Wing
   * @param m_frontLeftWingDamage Percentage of Damage of the Left Front Wing
   */
  updateFrontLeftWingDamage(m_frontLeftWingDamage: number) {
    const wingbefore = this._wingdamage.left;
    if (wingbefore !== m_frontLeftWingDamage) {
      this._wingdamage.left = m_frontLeftWingDamage;
      this.emit(DRIVER_EVENTS.WingStatus, this._driverNumber, this._wingdamage);
    }
  }

  /**
   * Searched a Driver in a Array knowing the Driver Number
   * @param number Driver Number of searched Driver
   * @param drivers Array that should be searched
   * @returns searched Driver
   */
  static getDriverFromDriverNr(number: number, drivers: Driver[]) {
    let resultDriver = undefined;
    drivers.forEach(driver => {
      if (driver._driverNumber === number) {
        resultDriver = driver;
      }
    });
    return resultDriver;
  }

  /**
   * Setter for Tyre wear
   * @param m_tyresWear TyreWear
   */
  updateTyreWear(m_tyresWear: number[]) {
    if (this._tyreWear !== m_tyresWear) {
      this._tyreWear = m_tyresWear;
      this.emit(DRIVER_EVENTS.TyreWear);
    }
    const currentlap = this._currentLapNum;
    if (typeof this._currentTyre !== 'undefined') {
      this._tyreHistory.set(currentlap, {
        tyre: this._currentTyre,
        wear: m_tyresWear,
      });
    }
  }
}
