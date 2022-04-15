import * as prefill from '../common/prefill';
import axios from 'axios/dist/axios';

import { urlParams } from '../common/generic';

let af_fields = [];
let pk = '';
const fldMap = {
  textdraw1637873340661: 'Su_id',
  FirstName_box: 'GivenName',
  Surname_box: 'surname',
  Bureau_box: 'Bureau',
  telephone_box: 'Telephone',
  Pri_number: 'Pri',
  Date_box: 'SignatureDate',
  Aboriginal: 'aboriginal',
  Minority_radio_button: 'minority',
  Minority_group_radio_buttons: 'MinorityGroup',
  Other_minorityGroup_box: 'OtherVisible',
  DisabilityOther: 'Otherdisability',
  Hr_radio_button: 'HrPurposes',
  disability_Radio_button: 'Disabilities',
  Gender_radio_box: 'Gender',
  Aboriginal_group: 'AboriginalGroup',
  Disability_Group_checkbox: 'DisabilitiesGroup',
};

const afFormReadyListener = () => {
  window.guideBridge.visit(function (cmp) {
    let cmpName = cmp.name;
    af_fields[cmpName] = cmp;
  });

  let dataRef = urlParams().get('dataRef');
  if (dataRef) {
    loadSurvey(dataRef).then((data) => {
      pk = data.Su_id;
      for (let aemfieldName in fldMap) {
        let fdmName = fldMap[aemfieldName];
        af_fields[aemfieldName].value =
          typeof data[fdmName] === 'string'
            ? data[fdmName].trim()
            : data[fdmName];
      }
    });
  }
};

function loadSurvey(Su_id) {
  let fdm_url =
    '/content/dam/formsanddocuments-fdm/main-survey-data-model.executeDermisQuery.json?';

  let inputs = JSON.stringify({ Su_id: Su_id });
  let operationName = 'get';
  let formData = new FormData();
  //formData.append('yinyang.png', blob);
  formData.append('operationName', operationName);
  formData.append('operationArguments', inputs);

  let extraData = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      a: 'b',
    },
  };

  let prom = new Promise((resolve) => {
    axios
      .post(fdm_url, formData, extraData)
      .then(function (response) {
        console.log(response);
        resolve(response.data[0]);
      })
      .catch(function (error) {
        console.log(error);
      });
  });
  return prom;
}

window.addEventListener('bridgeInitializeStart', (evnt) => {
  let gb = evnt.detail.guideBridge;
  gb.connect(afFormReadyListener);
});

export function save() {
  if (pk) {
    updateSurvey(pk);
  } else {
    insertSurvey();
  }
}

function updateSurvey(pk) {
  let data = prefill.getFormData(af_fields.guideRootPanel);
  let fdmData = {};
  for (let aemfieldName in fldMap) {
    if (data[aemfieldName]) {
      let fdmName = fldMap[aemfieldName];
      fdmData[fdmName] = data[aemfieldName];
    }
  }

  let fdm_url =
    '/content/dam/formsanddocuments-fdm/main-survey-data-model.executeDermisQuery.json?';
  let inputs = JSON.stringify({ Su_id: pk, Main_survey: fdmData });
  let operationName = 'update';
  let formData = new FormData();
  //formData.append('yinyang.png', blob);
  formData.append('operationName', operationName);
  formData.append('operationArguments', inputs);

  let extraData = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  let prom = new Promise((resolve) => {
    axios
      .post(fdm_url, formData, extraData)
      .then(function (response) {
        console.log(response);
        resolve(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  });
  return prom;
}

function insertSurvey() {
  let data = prefill.getFormData(af_fields.guideRootPanel);
  let fdmData = {};
  for (let aemfieldName in fldMap) {
    if (data[aemfieldName]) {
      let fdmName = fldMap[aemfieldName];
      fdmData[fdmName] = data[aemfieldName];
    }
  }

  let fdm_url =
    '/content/dam/formsanddocuments-fdm/main-survey-data-model.executeDermisQuery.json?';
  let inputs = JSON.stringify({ Main_survey: fdmData });
  let operationName = 'insert';
  let formData = new FormData();
  //formData.append('yinyang.png', blob);
  formData.append('operationName', operationName);
  formData.append('operationArguments', inputs);

  let extraData = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  let prom = new Promise((resolve) => {
    axios
      .post(fdm_url, formData, extraData)
      .then(function (response) {
        console.log(response);
        resolve(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  });
  return prom;
}
