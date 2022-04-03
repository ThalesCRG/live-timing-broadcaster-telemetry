/* eslint-disable no-case-declarations */
import * as dgram from 'dgram';
import {F1TelemetryClient} from 'f1-2021-udp';
import {PACKETS} from 'f1-2021-udp/build/src/constants';
import {
  PacketSessionHistoryData,
  PacketCarStatusData,
  PacketEventData,
  PacketParticipantsData,
  PacketSessionData,
  PacketCarDamageData,
  PacketLapData,
  PacketMotionData,
} from 'f1-2021-udp/build/src/parsers/packets/types';
import {ParsedMessage} from 'f1-2021-udp/build/src/types';
import {Driver} from './driver';
import {Infringement} from './Infringement';
import {Session, SESSION_EVENTS} from './session';
import * as TelemetryWebSocket from './telemetryWebSocket';

require('dotenv').config();

const client = new F1TelemetryClient({
  port: parseInt(process.env.UDP_PORT || '8999', 10),
  address: '0.0.0.0',
  forwardAddresses: [{port: parseInt(process.env.FWRD_PORT || '5550', 10)}],
  skipParsing: true,
});

const socket = dgram.createSocket('udp4');
socket.bind(parseInt(process.env.FWRD_PORT || '5550', 10));

/**
 * F1 2021 Session
 */
export let SESSION: Session = new Session();

/**
 * Drivers within the Current Session
 */
export let drivers: Driver[] = SESSION.drivers;

/**
 * Sends Drivers[] and Session to all Websocket Clients each 1000 ms
 */
setInterval(() => {
  const message = {drivers: drivers, session: SESSION};
  TelemetryWebSocket.broadcast(JSON.stringify(message));
}, 1000);

SESSION.on(SESSION_EVENTS.SessionTypeChanged, resetLobby);
SESSION.addListener(SESSION_EVENTS.SessionTypeChanged, () => resetLobby());

/**
 * Resets Lobby to new Array and new Session
 */
function resetLobby(): void {
  drivers = [];
  SESSION = new Session();
}

/**
 * Sends an Package to all Websocket Clients with Drivers[], session and Event
 * @param event Event that should be added to the normal Driver[], session array
 */
const sendEvent = function (event: {type: string; number?: number}) {
  const eventMessage = event;
  const message = {
    drivers: drivers,
    session: SESSION,
    event: eventMessage,
  };
  TelemetryWebSocket.broadcast(JSON.stringify(message));
};

/**
 * Adding EventHandler to the UDP-Socket and calls Handlers on specific Message Types
 */
try {
  socket.on('message', msg => {
    const parsedmsg = F1TelemetryClient.parseBufferMessage(
      msg
    ) as ParsedMessage;

    /**
     * Switches for Each Type of a ParsedMessage and handles it differently
     */
    switch (parsedmsg.packetID) {
      /**
       * PacketCarStatusData
       */
      case PACKETS.carStatus:
        const carStatusPacket = parsedmsg?.packetData
          ?.data as PacketCarStatusData;
        carStatusPacket.m_carStatusData.forEach((carStatus, index) => {
          const currentDriver = drivers[index];
          currentDriver?.updateTyre(
            carStatus.m_visualTyreCompound,
            carStatus.m_tyresAgeLaps
          );

          currentDriver?.updateFlag(carStatus.m_vehicleFiaFlags);
          currentDriver?.updateERS(carStatus.m_ersStoreEnergy);
        });

        break;
      /**
       * PacketCarDamageData
       */
      case PACKETS.carDamage:
        const carDamagePacket = parsedmsg?.packetData
          ?.data as PacketCarDamageData;
        carDamagePacket.m_carDamageData.forEach((currentCarDamage, index) => {
          const currentDriver = drivers[index];
          currentDriver?.updateFrontLeftWingDamage(
            currentCarDamage.m_frontLeftWingDamage
          );
          currentDriver?.updateFrontRightWingDamage(
            currentCarDamage.m_frontRightWingDamage
          );
          currentDriver?.updateTyreWear(
            currentCarDamage.m_tyresWear as unknown as number[]
          );
        });
        break;

      /**
       * PacketSessionData
       */
      case PACKETS.session:
        const sessionPacket = parsedmsg?.packetData?.data as PacketSessionData;
        SESSION?.updateAirTemperature(sessionPacket.m_airTemperature);
        SESSION?.updateTrackTemperature(sessionPacket.m_trackTemperature);
        SESSION?.updatePitSpeedLimit(sessionPacket.m_pitSpeedLimit);
        SESSION?.updateSessionTimeLeft(sessionPacket.m_sessionTimeLeft);
        SESSION?.updateSessionType(sessionPacket.m_sessionType);
        SESSION?.updateCurrentWeather(sessionPacket.m_weather);
        SESSION?.updateSafetyCarStatus(sessionPacket.m_safetyCarStatus);
        SESSION?.updateTrack(sessionPacket.m_trackId);
        SESSION?.updateTotalLaps(sessionPacket.m_totalLaps);

        SESSION?.updateWeatherForecasts(
          sessionPacket.m_weatherForecastSamples.slice(
            0,
            sessionPacket.m_numWeatherForecastSamples
          )
        );

        break;

      /**
       * PacketLapData
       */
      case PACKETS.lapData:
        const lapDataPackage = parsedmsg?.packetData?.data as PacketLapData;
        lapDataPackage.m_lapData.forEach((lapData, index) => {
          const currentDriver = drivers[index];
          currentDriver?.updateCarPosition(lapData.m_carPosition);
          currentDriver?.updateCurrentLap(lapData.m_currentLapNum);
          currentDriver?.updateCurrentSector(lapData.m_sector);
          currentDriver?.updateSector1Time(lapData.m_sector1Time);
          currentDriver?.updateSector2Time(lapData.m_sector2Time);
          currentDriver?.updateCurrentLapInvalid(lapData.m_currentLapInvalid);
          currentDriver?.updateTotalDistance(lapData.m_totalDistance);
          currentDriver?.updateTrackStatus(lapData.m_driverStatus);
          currentDriver?.updateResultStatus(lapData.m_resultStatus);
          currentDriver?.updateDriverStatus(lapData.m_driverStatus);

          // reason: workaround for missing type for this data in f1-2021-udp parser
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anydata = lapData as any;
          currentDriver?.updateLastLapTime(anydata.m_lastLapTimeInMS);
          currentDriver?.updateSector1Time(anydata.m_sector1TimeInMS);
          currentDriver?.updateSector2Time(anydata.m_sector2TimeInMS);
          currentDriver?.updatePitCount(anydata.m_numPitStops);
          currentDriver?.updatePenaltyTime(anydata.m_penalties);
          currentDriver?.updateGridPosition(anydata.m_gridPosition);
          currentDriver?.updateCurrentLapTime(anydata.m_currentLapTimeInMS);
          currentDriver?.updateNumUnservedDriveThroughPens(
            anydata.m_numUnservedDriveThroughPens
          );
          currentDriver?.updateNumUnservedStopGoPens(
            anydata.m_numUnservedStopGoPens
          );
        });

        break;

      /**
       * PacketParticipantsData
       */
      case PACKETS.participants:
        const participantDataPackage = parsedmsg?.packetData
          ?.data as PacketParticipantsData;

        participantDataPackage.m_participants.forEach((participent, index) => {
          if (drivers[index] === undefined || drivers[index] === null) {
            drivers[index] = new Driver(participent.m_raceNumber);
          } else if (
            drivers[index]?._driverNumber !== participent.m_raceNumber
          ) {
            drivers[index] = new Driver(participent.m_raceNumber);
          }

          // reason: workaround for missing type for this data in f1-2021-udp parser
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          drivers[index].updateTelemetry((participent as any).m_yourTelemetry);
          drivers[index].updateTeam(participent.m_teamId);
        });
        break;

      /**
       * PacketMotionData
       */
      case PACKETS.motion:
        const motionDataPackage = parsedmsg?.packetData
          ?.data as PacketMotionData;

        motionDataPackage.m_carMotionData.forEach((motiondata, index) => {
          const currentDriver = drivers[index];
          currentDriver?.updateMaxGForce(
            Math.sqrt(
              (motiondata.m_gForceLateral ^ 2) +
                (motiondata.m_gForceLongitudinal ^ 2) +
                (motiondata.m_gForceVertical ^ 2)
            )
          );
        });
        break;

      /**
       * PacketEventData
       */
      case PACKETS.event:
        const packetEvent = parsedmsg?.packetData?.data as PacketEventData;

        eventHandler(packetEvent);
        break;

      /**
       * PacketSessionHistoryData
       */
      case PACKETS.sessionHistory:
        const sessionHistoryMessage = parsedmsg?.packetData
          ?.data as PacketSessionHistoryData;

        const lapHistory = sessionHistoryMessage.m_lapHistoryData;
        const lapNr = sessionHistoryMessage.m_bestLapTimeLapNum;

        const s1Nr = sessionHistoryMessage.m_bestSector1LapNum;
        const s2Nr = sessionHistoryMessage.m_bestSector2LapNum;
        const s3Nr = sessionHistoryMessage.m_bestSector3LapNum;

        const lapTime =
          sessionHistoryMessage.m_lapHistoryData[lapNr - 1]?.m_lapTimeInMS;
        const s1Time =
          sessionHistoryMessage.m_lapHistoryData[s1Nr - 1]?.m_sector2TimeInMS;
        const s2Time =
          sessionHistoryMessage.m_lapHistoryData[s2Nr - 1]?.m_sector2TimeInMS;
        const s3Time =
          sessionHistoryMessage.m_lapHistoryData[s3Nr - 1]?.m_sector3TimeInMS;

        const driverIndex = sessionHistoryMessage.m_carIdx;
        const currentDriver = drivers[driverIndex];

        if (currentDriver !== undefined && currentDriver !== null) {
          currentDriver?.updateBestLapTime(lapTime);

          currentDriver?.updateBestSector1(s1Time);
          currentDriver?.updateBestSector2(s2Time);
          currentDriver?.updateBestSector3(s3Time);

          currentDriver?.updateLapHistory(
            lapHistory.slice(0, sessionHistoryMessage.m_numLaps - 1)
          );
        }
        break;
    }
  });
} catch (e) {
  console.log(e);
}

client.start();

/**
 * Since PacketEventData are more various its logic it is handled in this seperate Handler
 * @param packetEvent PacketEventData to Handle
 */
function eventHandler(packetEvent: PacketEventData) {
  // reason: workaround for missing type for this data in f1-2021-udp parser
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyevent = packetEvent as any;
  switch (packetEvent.m_eventStringCode) {
    case 'PENA':
      let currentDriver = drivers[anyevent.Penalty.vehicleIdx];
      const newInfrigment = new Infringement(
        anyevent.Penalty.penaltyType,
        anyevent.Penalty.infringementType,
        anyevent.Penalty.time,
        anyevent.Penalty.lapNum,
        anyevent.Penalty.placesGained
      );
      currentDriver?.addInfrigment(newInfrigment);
      break;
    case 'SPTP':
      currentDriver = drivers[anyevent.SpeedTrap.vehicleIdx];
      currentDriver?.addSpeedTrap(anyevent.SpeedTrap.speed as number);
      break;

    case 'FTLP':
      SESSION.updateFastestLap(
        anyevent.FastestLap.lapTime,
        drivers[anyevent.FastestLap.vehicleIdx]
      );
      break;
    case 'SSTA':
      resetLobby();
      console.log('Session Started');

      sendEvent({type: 'Session Started'});
      break;
    case 'SEND':
      console.log('SEND');
      sendEvent({type: 'Session Ended'});
      break;
    case 'RTMT':
      break;
    case 'DRSE':
      console.log('DRS enabled.');

      sendEvent({type: 'DRS enabled'});
      break;
    case 'DRSD':
      console.log('DRS disabled.');
      sendEvent({type: 'DRS disabled'});
      break;
    case 'CHQF':
      console.log('Chequered flag.');
      sendEvent({type: 'Chequered Flag'});
      break;
    case 'RCWN':
      console.log('Racewinner: ', anyevent.RaceWinner.vehicleIdx);
      break;
    case 'STLG':
      console.log('Starting Lights: ', anyevent.StartLights.numLights);
      sendEvent({
        type: 'startingLights',
        number: anyevent.StartLights.numLights,
      });
      break;
    case 'LGOT':
      console.log('Lights out and away we go!');
      sendEvent({type: 'Lights out'});
      break;
    case 'DTSV':
      break;
    case 'SGSV':
      break;
    case 'FLBK':
      sendEvent({type: 'Flashback used'});
      break;
    case 'BUTN':
      break;
    default:
      break;
  }
}

if (process.env.RESTORE_BACKUP === 'true') {
  const backup = require('../../backup/' + process.env.BACKUP_FILE);

  drivers = [];
  backup[0].forEach((driver: Driver) => {
    drivers.push(Driver.clone(driver));
  });

  SESSION = Session.clone(backup[1]);
}
