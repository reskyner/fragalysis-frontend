/**
 * Created by abradley on 03/03/2018.
 */
import { CONSTANTS } from './nglConstants';
import { nglObjectDictionary } from '../../components/nglView/renderingObjects';

export const loadObject = (target, stage) => dispatch => {
  if (stage) {
    dispatch(incrementCountOfPendingNglObjects());
    return nglObjectDictionary[target.OBJECT_TYPE](stage, target, target.name)
      .then(() =>
        dispatch({
          type: CONSTANTS.LOAD_OBJECT,
          target
        })
      )
      .catch(error => {
        console.error(error);
      })
      .finally(() => dispatch(decrementCountOfPendingNglObjects()));
  }
  return Promise.reject('Instance of NGL View is missing');
};

export const setOrientation = function(div_id, orientation) {
  return {
    type: CONSTANTS.SET_ORIENTATION,
    orientation: orientation,
    div_id: div_id
  };
};

export const setNGLOrientation = function(div_id, orientation) {
  return {
    type: CONSTANTS.SET_NGL_ORIENTATION,
    orientation: orientation,
    div_id: div_id
  };
};

export const deleteObject = (target, stage) => {
  const comps = stage.getComponentsByName(target.name);
  for (let component in comps.list) {
    stage.removeComponent(comps.list[component]);
  }
  return {
    type: CONSTANTS.DELETE_OBJECT,
    target
  };
};

export const setLoadingState = function(bool) {
  return {
    type: CONSTANTS.SET_LOADING_STATE,
    loadingState: bool
  };
};

export const setNglViewParams = (key, value, stage) => {
  stage.setParameters({ [key]: value });
  return {
    type: CONSTANTS.SET_NGL_VIEW_PARAMS,
    key,
    value
  };
};

export const resetNglViewToDefaultScene = (stage, display_div) => (dispatch, getState) => {
  const defaultScene = getState().nglReducers.present.defaultScene;
  dispatch({
    type: CONSTANTS.RESET_NGL_VIEW_TO_DEFAULT_SCENE
  });
  // Remove all components in NGL View
  stage.removeAllComponents();

  // Reconstruction of state in NGL View from defaultScene data
  // objectsInView
  Object.keys(defaultScene.objectsInView).forEach(objInView => {
    if (defaultScene.objectsInView[objInView].display_div === display_div) {
      dispatch(loadObject(defaultScene.objectsInView[objInView], stage));
    }
  });

  // loop for every nglViewParam
  Object.keys(defaultScene.viewParams).forEach(param => {
    dispatch(setNglViewParams([defaultScene.viewParams[param]], defaultScene.viewParams[param], stage));
  });

  // nglOrientations
  // orientationToSet
};

export const resetNglViewToLastScene = (stage, stageId) => ({
  type: CONSTANTS.RESET_NGL_VIEW_TO_LAST_SCENE,
  stage,
  stageId
});

export const saveCurrentStateAsDefaultScene = stage => ({ type: CONSTANTS.SAVE_NGL_STATE_AS_DEFAULT_SCENE, stage });

export const clearNglView = stage => ({ type: CONSTANTS.REMOVE_ALL_NGL_COMPONENTS, stage });

// Helper actions for marking that protein and molecule groups are successful loaded
export const setProteinsHasLoad = hasLoad => (dispatch, getState) => {
  const state = getState();
  if (state.nglReducers.present.countOfRemainingMoleculeGroups === 0 && hasLoad === true) {
    dispatch(saveCurrentStateAsDefaultScene());
  }
  dispatch({ type: CONSTANTS.SET_PROTEINS_HAS_LOADED, payload: hasLoad });
};

export const setCountOfRemainingMoleculeGroups = count => ({
  type: CONSTANTS.SET_COUNT_OF_REMAINING_MOLECULE_GROUPS,
  payload: count
});

export const incrementCountOfPendingNglObjects = () => ({
  type: CONSTANTS.INCREMENT_COUNT_OF_PENDING_NGL_OBJECTS
});

export const decrementCountOfPendingNglObjects = () => ({
  type: CONSTANTS.DECREMENT_COUNT_OF_PENDING_NGL_OBJECTS
});

export const decrementCountOfRemainingMoleculeGroups = () => (dispatch, getState) => {
  const state = getState();
  const decrementedCount = state.nglReducers.present.countOfRemainingMoleculeGroups - 1;
  if (decrementedCount === 0 && state.nglReducers.present.proteinsHasLoad === true) {
    dispatch(saveCurrentStateAsDefaultScene());
  }
  dispatch({
    type: CONSTANTS.DECREMENT_COUNT_OF_REMAINING_MOLECULE_GROUPS,
    payload: decrementedCount
  });
};
