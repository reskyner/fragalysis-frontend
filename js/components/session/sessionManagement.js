/**
 * Created by ricgillams on 13/06/2018.
 */

import React, { memo, useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import * as nglLoadActions from '../../reducers/ngl/nglLoadActions';
import * as apiActions from '../../reducers/api/apiActions';
import { Button, ButtonGroup, Grid, makeStyles } from '@material-ui/core';
import { getStore } from '../globalStore';
import * as selectionActions from '../../reducers/selection/selectionActions';
import { withRouter } from 'react-router-dom';
import * as listTypes from '../listTypes';
import DownloadPdb from '../downloadPdb';
import { savingStateConst, savingTypeConst } from './constants';
import { OBJECT_TYPE } from '../nglView/constants';
import { api, METHOD, getCsrfToken } from '../../utils/api';

const useStyles = makeStyles(theme => ({
  button: {
    margin: theme.spacing(1)
  },
  loader: {
    display: 'block',
    margin: '0 auto',
    borderCcolor: 'red'
  }
}));

const SessionManagement = memo(
  ({
    nglOrientations,
    savingState,
    uuid,
    latestSession,
    sessionId,
    sessionTitle,
    targetIdList,
    setSavingState,
    setOrientation,
    setNGLOrientation,
    loadObject,
    reloadApiState,
    reloadSelectionState,
    setLatestSession,
    setLatestSnapshot,
    setStageColor,
    setSessionId,
    setUuid,
    setSessionTitle,
    setVectorList,
    setBondColorMap,
    setTargetUnrecognised,
    setLoadingState
  }) => {
    const [/* state */ setState] = useState();
    const [saveType, setSaveType] = useState('');
    const [nextUuid, setNextUuid] = useState('');
    const [newSessionFlag, setNewSessionFlag] = useState(0);
    const classes = useStyles();
    const disableButtons =
      (savingState &&
        (savingState.startsWith(savingStateConst.saving) || savingState.startsWith(savingStateConst.overwriting))) ||
      false;

    const generateArrowObject = (start, end, name, colour) => {
      return {
        name: listTypes.VECTOR + '_' + name,
        OBJECT_TYPE: OBJECT_TYPE.ARROW,
        start: start,
        end: end,
        colour: colour
      };
    };

    const generateCylinderObject = (start, end, name, colour) => {
      return {
        name: listTypes.VECTOR + '_' + name,
        OBJECT_TYPE: OBJECT_TYPE.CYLINDER,
        start: start,
        end: end,
        colour: colour
      };
    };

    const postToServer = sessionState => {
      setSavingState(sessionState);
      for (var key in nglOrientations) {
        setOrientation(key, 'REFRESH');
      }
    };

    const newSession = () => {
      postToServer(savingStateConst.savingSession);
      setSaveType(savingTypeConst.sessionNew);
    };

    const saveSession = () => {
      postToServer(savingStateConst.overwritingSession);
      setSaveType(savingTypeConst.sessionNew);
    };

    const newSnapshot = () => {
      postToServer(savingStateConst.savingSnapshot);
      setSaveType(savingTypeConst.snapshotNew);
    };

    const restoreOrientation = useCallback(
      myOrientDict => {
        for (var div_id in myOrientDict) {
          var orientation = myOrientDict[div_id]['orientation'];
          var components = myOrientDict[div_id]['components'];
          for (var component in components) {
            loadObject(components[component]);
          }
          setNGLOrientation(div_id, orientation);
        }
      },
      [loadObject, setNGLOrientation]
    );

    const generateObjectList = useCallback(out_data => {
      var colour = [1, 0, 0];
      var deletions = out_data.deletions;
      var outList = [];
      for (var key in deletions) {
        outList.push(generateArrowObject(deletions[key][0], deletions[key][1], key.split('_')[0], colour));
      }
      var additions = out_data.additions;
      for (var key in additions) {
        outList.push(generateArrowObject(additions[key][0], additions[key][1], key.split('_')[0], colour));
      }
      var linker = out_data.linkers;
      for (var key in linker) {
        outList.push(generateCylinderObject(linker[key][0], linker[key][1], key.split('_')[0], colour));
      }
      var rings = out_data.ring;
      for (var key in rings) {
        outList.push(generateCylinderObject(rings[key][0], rings[key][2], key.split('_')[0], colour));
      }
      return outList;
    }, []);

    const generateBondColorMap = inputDict => {
      var out_d = {};
      for (let keyItem in inputDict) {
        for (let vector in inputDict[keyItem]) {
          const vect = vector.split('_')[0];
          out_d[vect] = inputDict[keyItem][vector];
        }
      }
      return out_d;
    };

    const handleVector = useCallback(
      json => {
        var objList = generateObjectList(json['3d']);
        setVectorList(objList);
        var vectorBondColorMap = generateBondColorMap(json['indices']);
        setBondColorMap(vectorBondColorMap);
      },
      [generateObjectList, setBondColorMap, setVectorList]
    );

    const redeployVectorsLocal = useCallback(
      url => {
        api({ url })
          .then(response => handleVector(response.data['vectors']))
          .catch(error => {
            setState(() => {
              throw error;
            });
          });
      },
      [handleVector, setState]
    );

    const reloadSession = useCallback(
      myJson => {
        var jsonOfView = JSON.parse(JSON.parse(JSON.parse(myJson.scene)).state);
        reloadApiState(jsonOfView.apiReducers.present);
        reloadSelectionState(jsonOfView.selectionReducers.present);
        setStageColor(jsonOfView.nglReducers.present.stageColor);
        restoreOrientation(jsonOfView.nglReducers.present.nglOrientations);
        if (jsonOfView.selectionReducers.present.vectorOnList.length !== 0) {
          var url =
            window.location.protocol +
            '//' +
            window.location.host +
            '/api/vector/' +
            jsonOfView.selectionReducers.present.vectorOnList[JSON.stringify(0)] +
            '/';
          redeployVectorsLocal(url);
        }
        setSessionTitle(myJson.title);
        setSessionId(myJson.id);
      },
      [
        redeployVectorsLocal,
        reloadApiState,
        reloadSelectionState,
        restoreOrientation,
        setSessionId,
        setSessionTitle,
        setStageColor
      ]
    );

    const checkTarget = useCallback(
      myJson => {
        var jsonOfView = JSON.parse(JSON.parse(JSON.parse(myJson.scene)).state);
        var target = jsonOfView.apiReducers.present.target_on_name;
        var targetUnrecognised = true;
        for (var i in targetIdList) {
          if (target === targetIdList[i].title) {
            targetUnrecognised = false;
          }
        }
        if (targetUnrecognised === true) {
          setLoadingState(false);
        }
        setTargetUnrecognised(targetUnrecognised);
        if (targetUnrecognised === false) {
          reloadSession(myJson);
        }
      },
      [reloadSession, setLoadingState, setTargetUnrecognised, targetIdList]
    );

    const handleJson = useCallback(
      myJson => {
        if (myJson.scene === undefined) {
          return;
        }
        checkTarget(myJson);
      },
      [checkTarget]
    );

    const generateNextUuid = useCallback(() => {
      if (nextUuid === '') {
        const uuidv4 = require('uuid/v4');
        setNextUuid(uuidv4());
        setNewSessionFlag(1);
      }
    }, [nextUuid]);

    const getSessionDetails = useCallback(() => {
      api({ method: METHOD.GET, url: '/api/viewscene/?uuid=' + latestSession })
        .then(response =>
          response.data && response.data.results.length > 0
            ? setSessionTitle(response.data.results[JSON.stringify(0)].title)
            : setSessionTitle('')
        )
        .catch(error => {
          setState(() => {
            throw error;
          });
        });
    }, [latestSession, setSessionTitle, setState]);

    const updateFraggleBox = useCallback(
      myJson => {
        if (saveType === savingTypeConst.sessionNew && myJson) {
          setLatestSession(myJson.uuid);
          setSessionId(myJson.id);
          setSessionTitle(myJson.title);
          setSaveType('');
          setNextUuid('');
          getSessionDetails();
        } else if (saveType === savingTypeConst.sessionSave) {
          setSaveType('');
          getSessionDetails();
        } else if (saveType === savingTypeConst.snapshotNew && myJson) {
          setLatestSnapshot(myJson.uuid);
          setSaveType('');
        }
      },
      [getSessionDetails, saveType, setLatestSession, setLatestSnapshot, setSessionId, setSessionTitle]
    );

    // componentDidUpdate
    useEffect(() => {
      generateNextUuid();
      var hasBeenRefreshed = true;
      if (uuid !== 'UNSET') {
        api({ method: METHOD.GET, url: '/api/viewscene/?uuid=' + uuid })
          .then(response => handleJson(response.data.results[0]))
          .catch(error => {
            setState(() => {
              throw error;
            });
          });
      }
      for (var key in nglOrientations) {
        if (nglOrientations[key] === 'REFRESH') {
          hasBeenRefreshed = false;
        }
        if (nglOrientations[key] === 'STARTED') {
          hasBeenRefreshed = false;
        }
      }
      if (hasBeenRefreshed === true) {
        var store = JSON.stringify(getStore().getState());
        const timeOptions = {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: false
        };
        var TITLE = 'Created on ' + new Intl.DateTimeFormat('en-GB', timeOptions).format(Date.now());
        // eslint-disable-next-line no-undef
        var userId = DJANGO_CONTEXT['pk'];
        var stateObject = JSON.parse(store);
        var newPresentObject = Object.assign(stateObject.apiReducers.present, {
          latestSession: nextUuid
        });

        const fullState = {
          state: JSON.stringify({
            apiReducers: { present: newPresentObject },
            nglReducers: { present: stateObject.nglReducers.present },
            selectionReducers: { present: stateObject.selectionReducers.present }
          })
        };

        if (saveType === savingTypeConst.sessionNew && newSessionFlag === 1) {
          setNewSessionFlag(0);
          var formattedState = {
            uuid: nextUuid,
            title: TITLE,
            user_id: userId,
            scene: JSON.stringify(JSON.stringify(fullState))
          };
          api({
            url: '/api/viewscene/',
            method: METHOD.POST,
            headers: {
              'X-CSRFToken': getCsrfToken(),
              accept: 'application/json',
              'content-type': 'application/json'
            },
            data: JSON.stringify(formattedState)
          })
            .then(response => {
              updateFraggleBox(response.data);
            })
            .catch(error => {
              setState(() => {
                throw error;
              });
            });
        } else if (saveType === savingTypeConst.sessionSave) {
          formattedState = {
            scene: JSON.stringify(JSON.stringify(fullState))
          };
          api({
            url: '/api/viewscene/' + JSON.parse(sessionId),
            method: METHOD.PATCH,
            headers: {
              'X-CSRFToken': getCsrfToken(),
              accept: 'application/json',
              'content-type': 'application/json'
            },
            data: JSON.stringify(formattedState)
          })
            .then(response => {
              updateFraggleBox(response.data);
            })
            .catch(error => {
              setState(() => {
                throw error;
              });
            });
        } else if (saveType === savingTypeConst.snapshotNew) {
          const uuidv4 = require('uuid/v4');
          formattedState = {
            uuid: uuidv4(),
            title: 'undefined',
            user_id: userId,
            scene: JSON.stringify(JSON.stringify(fullState))
          };
          api({
            url: '/api/viewscene/',
            method: METHOD.POST,
            headers: {
              'X-CSRFToken': getCsrfToken(),
              accept: 'application/json',
              'content-type': 'application/json'
            },
            data: JSON.stringify(formattedState)
          })
            .then(response => {
              updateFraggleBox(response.data);
            })
            .catch(error => {
              setState(() => {
                throw error;
              });
            });
        }
      }
    }, [generateNextUuid, handleJson, newSessionFlag, nextUuid, nglOrientations, saveType, sessionId, setState, setUuid, updateFraggleBox, uuid]);

    const { pathname } = location;
    let buttons = null;
    if (
      pathname !== '/viewer/react/landing' &&
      pathname !== '/viewer/react/funders' &&
      pathname !== '/viewer/react/sessions' &&
      pathname !== '/viewer/react/targetmanagement'
    ) {
      if (sessionTitle === undefined || sessionTitle === 'undefined') {
        buttons = (
          <Grid container direction="column" justify="center" alignItems="center">
            <Grid item>
              <ButtonGroup variant="contained" className={classes.button} disabled={disableButtons}>
                <Button color="primary" disabled>
                  Save Session
                </Button>
                <Button color="primary" onClick={newSession}>
                  Save Session As...
                </Button>
                <Button color="primary" onClick={newSnapshot}>
                  Share Snapshot
                </Button>
                <DownloadPdb />
              </ButtonGroup>
            </Grid>
            <Grid item>
              <p>Currently no active session.</p>
            </Grid>
          </Grid>
        );
      } else {
        buttons = (
          <Grid container direction="column" justify="center" alignItems="center">
            <Grid item>
              <ButtonGroup variant="contained" className={classes.button} disabled={disableButtons}>
                <Button color="primary" onClick={saveSession}>
                  Save Session
                </Button>
                <Button color="primary" onClick={newSession}>
                  Save Session As...
                </Button>
                <Button color="primary" onClick={newSnapshot}>
                  Share Snapshot
                </Button>
                <DownloadPdb />
              </ButtonGroup>
            </Grid>
            <Grid item>
              <p>Session: {sessionTitle}</p>
            </Grid>
          </Grid>
        );
      }
    }

    return buttons;
  }
);

function mapStateToProps(state) {
  return {
    nglOrientations: state.nglReducers.present.nglOrientations,
    savingState: state.apiReducers.present.savingState,
    uuid: state.apiReducers.present.uuid,
    latestSession: state.apiReducers.present.latestSession,
    sessionId: state.apiReducers.present.sessionId,
    sessionTitle: state.apiReducers.present.sessionTitle,
    targetIdList: state.apiReducers.present.target_id_list
  };
}

const mapDispatchToProps = {
  setSavingState: apiActions.setSavingState,
  setOrientation: nglLoadActions.setOrientation,
  setNGLOrientation: nglLoadActions.setNGLOrientation,
  loadObject: nglLoadActions.loadObject,
  reloadApiState: apiActions.reloadApiState,
  reloadSelectionState: selectionActions.reloadSelectionState,
  setLatestSession: apiActions.setLatestSession,
  setLatestSnapshot: apiActions.setLatestSnapshot,
  setStageColor: nglLoadActions.setStageColor,
  setSessionId: apiActions.setSessionId,
  setUuid: apiActions.setUuid,
  setSessionTitle: apiActions.setSessionTitle,
  setVectorList: selectionActions.setVectorList,
  setBondColorMap: selectionActions.setBondColorMap,
  setTargetUnrecognised: apiActions.setTargetUnrecognised,
  setLoadingState: nglLoadActions.setLoadingState
};
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SessionManagement));
