import EventEmitter from 'events';
import {SAFETY_CAR_STATUSES, WEATHER} from 'f1-2021-udp/build/src/constants';
import {WeatherForecastSample} from 'f1-2021-udp/build/src/parsers/packets/types';
import {Driver} from './driver';

/**
 * Types of Session
 * Practices, Qualifyings, Races and Time Trail
 */
enum SESSION_TYPE {
  'unknown',
  'P1',
  'P2',
  'P3',
  'Short P',
  'Q1',
  'Q2',
  'Q3',
  'Short Q',
  'OSQ',
  'R',
  'R2',
  'Time Trial',
}

export enum SESSION_EVENTS {
  FastesLapUpdate = 'FastesLapUpdate',
  SessionTypeChanged = 'SessionTypeChanged',
  CurrentWeatherUpdate = 'CurrentWeatherUpdate',
  AirTemperatureChange = 'AirTemperatureChange',
  TrackTemperatureChange = 'TrackTemperatureChange',
  sessionTimeLeftChanged = 'sessionTimeLeftChanged',
  PitSpeedLimitChanged = 'PitSpeedLimitChanged',
  SafetyCarStatusChanged = 'SafetyCarStatusChanged',
}

/**
 * Session
 */
export class Session extends EventEmitter {
  trackLenght?: number;
  bestSector1?: number;
  bestSector2?: number;
  bestSector3?: number;
  track?: number;
  fastestLap?: {time: number; driver: Driver};
  lightsOutTime = 0;
  safetyCarStatus = 0;
  airTemperature = 0;
  trackTemperature = 0;
  sessionType = 0;
  sessionTimeLeft = 0;
  pitSpeedLimit = 0;
  currentWeather = 0;
  weatherForecasts: WeatherForecastSample[] = [];
  totalLaps = 0;
  drivers: Driver[] = new Array<Driver>();

  /**
   * Clones a Session; Started as a Workaround
   * @param session Session to Clone
   * @returns cloned Session
   */
  static clone(session: Session) {
    const resultSession = new Session();

    resultSession.bestSector1 = session.bestSector1;
    resultSession.bestSector2 = session.bestSector2;
    resultSession.bestSector3 = session.bestSector3;
    resultSession.track = session.track;
    resultSession.fastestLap = session.fastestLap;
    resultSession.lightsOutTime = session.lightsOutTime;
    resultSession.safetyCarStatus = session.safetyCarStatus;
    resultSession.airTemperature = session.airTemperature;
    resultSession.trackTemperature = session.trackTemperature;
    resultSession.sessionType = session.sessionType;
    resultSession.sessionTimeLeft = session.sessionTimeLeft;
    resultSession.pitSpeedLimit = session.pitSpeedLimit;
    resultSession.currentWeather = session.currentWeather;
    resultSession.weatherForecasts = session.weatherForecasts;
    resultSession.totalLaps = session.totalLaps;

    return resultSession;
  }

  /**
   * Setter for total laps
   * @param m_totalLaps Total Laps to Drive in a Race
   */
  updateTotalLaps(m_totalLaps: number) {
    this.totalLaps = m_totalLaps;
  }

  /**
   * Setter for Weather Forcast
   * @param forecast Weather Forecast for the Session
   */
  updateWeatherForecasts(forecast: WeatherForecastSample[]) {
    this.weatherForecasts = forecast;
  }

  /**
   * Setter for the Fastest Lap of the Race Session
   * @param lapTime laptime in ms
   * @param driver driver who achieved this fastest lap
   */
  updateFastestLap(lapTime: number, driver: Driver) {
    this.fastestLap = {time: lapTime, driver: driver};
    this.emit(SESSION_EVENTS.FastesLapUpdate, this.fastestLap);
  }

  /**
   * Setter for Track
   * @param track Track the Session is hold on
   */
  updateTrack(track: number) {
    this.track = track;
  }

  /**
   * Setter for best Sector one
   * @param bestSector1 time of the first sector
   */
  updateBestSector1(bestSector1: number) {
    if (
      typeof this.bestSector1 === 'undefined' ||
      this.bestSector1 > bestSector1
    )
      this.bestSector1 = bestSector1;
  }

  /**
   * Setter for best Sector two
   * @param bestSector2 time of the second sector
   */
  updateBestSector2(bestSector2: number) {
    if (
      typeof this.bestSector2 === 'undefined' ||
      this.bestSector2 > bestSector2
    )
      this.bestSector2 = bestSector2;
  }

  /**
   * Setter for best Sector three
   * @param bestSector1 time of the third sector
   */
  updateBestSector3(bestSector3: number) {
    if (
      typeof this.bestSector3 === 'undefined' ||
      this.bestSector3 > bestSector3
    )
      this.bestSector3 = bestSector3;
  }

  /**
   * Setter for trackLength
   * @param trackLenght length of the Track
   */
  updateTrackLenght(trackLenght: number) {
    this.trackLenght = trackLenght;
  }

  constructor() {
    super();
  }

  /**
   * Setter for Current Weather
   * @param m_weather WeatherId of the current weather
   */
  updateCurrentWeather(m_weather: number) {
    if (this.currentWeather !== m_weather) {
      this.currentWeather = m_weather;
      this.emit(SESSION_EVENTS.CurrentWeatherUpdate);
    }
  }

  /**
   * resets all Drivers; needed because of infringements shall not pass to next session
   */
  resetSession() {
    this.drivers = [];
  }

  /**
   * Setter for the sessionType
   * @param m_sessionType TypeId of the current Session
   */
  updateSessionType(m_sessionType: number) {
    if (this.sessionType !== m_sessionType) {
      this.sessionType = m_sessionType;
      this.resetSession;
    }
  }

  /**
   * Setter for sessionTimeLeft
   * @param m_sessionTimeLeft remaining time in current Session
   */
  updateSessionTimeLeft(m_sessionTimeLeft: number) {
    if (this.sessionTimeLeft !== m_sessionTimeLeft)
      this.sessionTimeLeft = m_sessionTimeLeft;
    this.emit(SESSION_EVENTS.sessionTimeLeftChanged);
  }

  /**
   * Setter for pitSpeedLimit
   * @param m_pitSpeedLimit speed limit of the pitlane
   */
  updatePitSpeedLimit(m_pitSpeedLimit: number) {
    if (this.pitSpeedLimit !== m_pitSpeedLimit)
      this.pitSpeedLimit = m_pitSpeedLimit;
    this.emit(SESSION_EVENTS.PitSpeedLimitChanged);
  }

  /**
   * Setter for safetyCarStatus
   * @param m_safetyCarStatus current Safetycar status
   */
  updateSafetyCarStatus(m_safetyCarStatus: number) {
    if (this.safetyCarStatus !== m_safetyCarStatus) {
      this.safetyCarStatus = m_safetyCarStatus;
      this.emit(SESSION_EVENTS.SafetyCarStatusChanged);
    }
  }

  /**
   * Setter for trackTemperature
   * @param trackTemperature current track temperature in °C
   */
  updateTrackTemperature(trackTemperature: number) {
    if (this.trackTemperature !== trackTemperature) {
      this.trackTemperature = trackTemperature;
      this.emit(SESSION_EVENTS.TrackTemperatureChange);
    }
  }

  /**
   * Setter for airTemperature
   * @param airTemperature current air temperature in °C
   */
  updateAirTemperature(airTemperature: number): void {
    if (this.airTemperature !== airTemperature) {
      this.airTemperature = airTemperature;
      this.emit(SESSION_EVENTS.AirTemperatureChange);
    }
  }

  /**
   * Returns basic information of the session as a String
   * @returns String representation of basic Info in this session
   */
  public toString() {
    let result = '';
    result += ' Lights out at time: ' + this.lightsOutTime;
    result +=
      ' Fastest Lap: ' +
      this.fastestLap?.time +
      ' by ' +
      this.fastestLap?.driver;
    result += ' SafetyCarStatus: ' + SAFETY_CAR_STATUSES[this.safetyCarStatus];
    result += ' Air Temperature: ' + this.airTemperature;
    result += ' Track Temperature: ' + this.trackTemperature;
    result += ' Session Type: ' + SESSION_TYPE[this.sessionType];
    result += ' Time Left: ' + this.sessionTimeLeft;
    result += ' Speed Limit: ' + this.pitSpeedLimit;
    result += ' Current Weather: ' + WEATHER[this.currentWeather];
    return result;
  }
}
