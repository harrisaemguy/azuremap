//let flatdata = getFormData(af_fields['guideRootPanel']);
export function getFormData(panel) {
  let jsObj = arguments[1] || {};

  panel.items.forEach(function (item) {
    let guideNodeClass = item.jsonModel?.guideNodeClass;
    let value = item.jsonModel?._value;
    if (guideNodeClass === 'guideTermsAndConditions') {
      value = item.jsonModel.clickStatus;
    } else if (guideNodeClass === 'guideTableRow') {
      // guideTableRow
      if (item.repeatable == true) {
        let subObj = {};
        getFormData(item, subObj);
        if (!$.isEmptyObject(subObj)) {
          jsObj[item.name] = jsObj[item.name] || [];
          jsObj[item.name].push(subObj);
        }
      } else {
        getFormData(item, jsObj);
      }
    } else if (guideNodeClass === 'guideTable') {
      // guideTable
      getFormData(item, jsObj);
    } else if (
      guideNodeClass &&
      guideNodeClass !== 'guideTextDraw' &&
      guideNodeClass !== 'guidePanel' &&
      guideNodeClass !== 'guideButton'
    ) {
      // jsObj[item.name] = typeof value !== 'undefined' ? value : null;
      if (typeof value !== 'undefined') {
        jsObj[item.name] = value;

        if (value == null) {
          delete jsObj[item.name];
        }
      }
    } else if (item.repeatable == false) {
      // is panel
      getFormData(item, jsObj);
    } else if (item.repeatable == true) {
      // is repeated panel
      let subObj = {};
      getFormData(item, subObj);
      if (!$.isEmptyObject(subObj)) {
        jsObj[item.name] = jsObj[item.name] || [];
        jsObj[item.name].push(subObj);
      }
    }
  });

  return jsObj;
}

const _inputFieldClassNames = [
  'guideTextBox',
  'guideCheckBox',
  'guideRadioButton',
  'guideDropDownList',
  'guideDatePicker',
  'guideTelephone',
  'guideNumericBox',
  'guideSwitch',
];

function _getDirectInputs(panel) {
  let flds = arguments[1] || [];

  panel.items.forEach(function (item) {
    if (DC._inputFieldClassNames.indexOf(item.className) != -1) {
      flds[item.name] = item;
    }

    if ('guidePanel' === item.className && item.repeatable == false) {
      // simple panel
      _getDirectInputs(item, flds);
    }

    if ('guidePanel' === item.className && item.repeatable == true) {
      // repeatabl panel
      flds[item.name] = item;
    }

    if ('guideTableRow' === item.className && item.repeatable == false) {
      // simple guideTableRow
      _getDirectInputs(item, flds);
    }

    if ('guideTableRow' === item.className && item.repeatable == true) {
      // repeatabl guideTableRow
      flds[item.name] = item;
    }

    if ('guideTable' === item.className) {
      // guideTable
      _getDirectInputs(item, flds);
    }
  });

  return flds;
}

// prefill(data, af_fields['guideRootPanel']);
export function prefill(data, panel) {
  let directFields = _getDirectInputs(panel);

  for (let aemfieldName in data) {
    // console.log(aemfieldName);

    if (
      typeof data[aemfieldName] !== 'undefined' &&
      data[aemfieldName] !== 'null'
    ) {
      if (
        $.isArray(data[aemfieldName]) ||
        aemfieldName.startsWith('fileupload')
      ) {
        // create repeatable section, and populate values
        let data_x = data[aemfieldName];
        let section = directFields[aemfieldName];
        if (section && section.repeatable == true) {
          // available repeatable section
          for (let i = 0; i < data_x.length; i++) {
            let data_i = data_x[i];
            let panel_i = undefined;

            if (i >= section.instanceManager.instanceCount) {
              panel_i = section.instanceManager.addInstance();
            } else {
              panel_i = section.instanceManager.instances[i];
            }

            panel_i.visible = true;

            prefill(data_i, panel_i);
          }
        } else {
          console.log('Not able to find field: ' + aemfieldName);
        }
      } else if (directFields[aemfieldName]) {
        if (
          directFields[aemfieldName].jsonModel.guideNodeClass ===
          'guideTermsAndConditions'
        ) {
          let tcName = directFields[aemfieldName].name;
          if ('agree' === data[aemfieldName]) {
            $('.' + tcName + ' input').prop('checked', true);
          } else {
            $('.' + tcName + ' input').prop('checked', false);
          }
        } else {
          // signature and other input
          directFields[aemfieldName].value = data[aemfieldName];
        }
      } else {
        console.log('Not able to find field: ' + aemfieldName);
      }
    }
  }
}

//var parser = new DOMParser();
//var xmlDoc = parser.parseFromString(guideResultObject.data, "text/xml");
//var afUnboundData_data = xmlDoc.getElementsByTagName('afUnboundData')[0].firstChild;
export function initDataXml() {
  return new Promise((resolve, reject) => {
    guideBridge.getDataXML({
      success: function (guideResultObject) {
        console.log('xml data received' + guideResultObject.data);
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(guideResultObject.data, 'text/xml');
        resolve(xmlDoc);
      },
      error: function (guideResultObject) {
        let msg = guideResultObject.getNextMessage();
        let msgs = [];
        msgs.push(msg);
        while (msg != null) {
          console.error(msg.message);
          msg = guideResultObject.getNextMessage();
          msgs.push(msg);
        }
        reject(msgs);
      },
    });
  });
}

// "/data/fname"
// dc.form_gac.initDataXml().then(function(data){ var x = dc.form_gac.getNodeValue_bypath(data, '/data/fname'); console.log(x);});
export function getNodeValue_bypath(xml, path) {
  console.log(xml);
  let nodes = xml.evaluate(path, xml, null, XPathResult.ANY_TYPE, null);
  let values = [];
  while (true) {
    let result = nodes.iterateNext();
    if (result) {
      values.push(result.childNodes[0].nodeValue);
      result = nodes.iterateNext();
    } else {
      break;
    }
  }
  return values;
}
