/*testing*/
/*
let myMap = new Map().set('age', 7).set('foo', 3);

let str1 = mapToJsonStr(myMap);
console.log(str1);
console.log(jsonStrToMap(str1));
let map2 = objToStrMap(myMap);
console.log(map2);

let myObj = { age: 7, foo: 3 };
let map3 = objToStrMap(myObj);
console.log(map3);
*/

export function mapToJsonStr(map) {
  return JSON.stringify([...map]);
}

export function jsonStrToMap(jsonStr) {
  return new Map(JSON.parse(jsonStr));
}

export function jsonStrToStrMap(jsonStr) {
  let obj = JSON.parse(jsonStr);

  return objToStrMap(obj);
}

export function objToStrMap(obj) {
  if (obj instanceof Map) {
    // obj.forEach((v, k, m) => {});
    return obj;
  } else {
    let strMap = new Map();
    for (let k of Object.keys(obj)) {
      strMap.set(k, obj[k]);
    }
    return strMap;
  }
}

export function strMapToObj(strMap) {
  let obj = Object.create(null);
  for (let [k, v] of strMap) {
    // We don’t escape the key '__proto__'
    // which can cause problems on older engines
    obj[k] = v;
  }
  return obj;
}

/*
 * //const processChange = debounce(fn); // <button onclick="processChange()">Click me</button> // window.addEventListener("scroll", processChange); //ex: let fn1 = debounce(fn)
 */
export function debounce(func, context, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(context || this, args);
    }, timeout);
  };
}

// call immediately, and ignore subsequent
// ex: let fn1=debounce_leading(fn)
export function debounce_leading(func, context, timeout = 300) {
  let timer;
  return (...args) => {
    if (!timer) {
      func.apply(context || this, args);
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
    }, timeout);
  };
}

// ex: let fn1 = execOnce(loadAtlas)
export function execOnce(func, context) {
  let result;
  return (...args) => {
    if (func) {
      result = func.apply(context || this, args);
      func = null;
    }
    return result;
  };
}

// ex: sleep(2000).then( ()=>{} );
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// id is available for repeatable items
export function getAfFieldId(afField) {
  return afField.jsonModel.id || afField.jsonModel.templateId;
}

export function renderStaticHtml(fld, html) {
  if ('guideTextDraw' === fld.className) {
    let fldId = getAfFieldId(fld);
    $('#' + fldId).html(html);
  }
}

// promise('#idd1').then( ()={} );
export function promise(cssSelector, visible = false) {
  return new Promise(function (resolve) {
    let checking = setInterval(() => {
      let total = $(cssSelector).length;
      if (
        (visible && $(cssSelector).is(':visible')) ||
        (!visible && $(cssSelector).length > 0)
      ) {
        clearInterval(checking);
        resolve(true);
      }
    }, 5);
  });
}

export function yourLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let userPosition = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        };
        resolve(userPosition);
      },
      (error) => {
        // If an error occurs when trying to access the users position information, display an error message.
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('User denied the request for Geolocation.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Position information is unavailable.');
            break;
          case error.TIMEOUT:
            alert('The request to get user position timed out.');
            break;
          case error.UNKNOWN_ERROR:
            alert('An unknown error occurred.');
            break;
        }
        resolve(undefined);
      }
    );
  });
}

// ex: getUrlParam('wcmmode')
export function getUrlParam(name, url = window.location.href) {
  let results = new RegExp('[?&]' + name.toLowerCase() + '=([^&#]*)').exec(
    url.toLowerCase()
  );
  if (results == null) {
    return null;
  } else {
    return decodeURI(results[1]) || 0;
  }
}

// guidelib.util.GuideUtil.navigateToURL('/content/dam/formsanddocuments/dc-sandbox/ttt/jcr:content?wcmmode=disabled','SAME_TAB')
// guidelib.util.GuideUtil.navigateToURL('http://www.google.com','SAME_TAB')
export function navigateToURL(url) {
  guidelib.util.GuideUtil.navigateToURL(url, 'SAME_TAB');
}

let cdnPromises = new Map();
// promise load once for all invoker
export function CDN_inHead({ type = 'text/javascript', href, src }) {
  let key = 'text/css' === type ? href : src;
  if (key && cdnPromises.get(key)) {
    return cdnPromises.get(key);
  } else if ('text/css' === type && href) {
    let prom = new Promise((resolve) => {
      let link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.type = type;
      document.head.appendChild(link);
      resolve({});
    });

    cdnPromises.set(href, prom);
    return prom;
  } else if ('text/javascript' === type && src) {
    let prom = new Promise((resolve) => {
      let script = document.createElement('script');
      script.type = type;
      script.onload = () => {
        resolve({});
      };
      script.src = src;
      document.head.appendChild(script);
    });

    cdnPromises.set(src, prom);
    return prom;
  }
}
